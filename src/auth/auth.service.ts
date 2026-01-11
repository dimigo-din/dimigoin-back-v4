import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { subMonths } from "date-fns";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { StringValue } from "ms";
import { LessThan, Repository } from "typeorm";
import { ErrorMsg } from "../common/mapper/error";
import { PermissionEnum } from "../common/mapper/permissions";
import { UserJWT } from "../common/mapper/types";
import { CacheService } from "../common/modules/cache.module";
import { hasPermission } from "../common/utils/permission.util";
import { UserManageService } from "../routes/user/providers";
import { Login, Session, User } from "../schemas";
import { JWTResponse, RedirectUriDTO } from "./auth.dto";

@Injectable()
export class AuthService {
  genURLOauthClient: OAuth2Client;
  googleOauthClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UserManageService))
    private readonly userManageService: UserManageService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Login)
    private readonly loginRepository: Repository<Login>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {
    this.genURLOauthClient = new OAuth2Client({
      clientId: configService.get<string>("GCP_OAUTH_ID"),
    });
    this.googleOauthClient = new OAuth2Client({
      clientId: configService.get<string>("GCP_OAUTH_ID"),
      clientSecret: configService.get<string>("GCP_OAUTH_SECRET"),
    });
  }

  async loginByIdPassword(id: string, password: string) {
    const login = await this.loginRepository.findOne({
      where: { identifier1: id || "", type: "password" },
    });
    if (!login) {
      throw new HttpException(ErrorMsg.UserIdentifier_NotFound(), HttpStatus.UNAUTHORIZED);
    }
    if (!Bun.password.verify(password, login.identifier2 ?? "")) {
      throw new HttpException(ErrorMsg.UserIdentifier_NotMatched(), HttpStatus.UNAUTHORIZED);
    }

    return await this.generateJWTKeyPair(login.user, "30m");
  }

  async getGoogleLoginUrl(data: RedirectUriDTO): Promise<string> {
    const redirect_uri = data.redirect_uri;

    const scopes: string[] = [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];
    return this.genURLOauthClient.generateAuthUrl({
      response_type: "code",
      access_type: "online",
      prompt: "consent",
      scope: scopes,
      ...(redirect_uri ? { redirect_uri } : {}),
    });
  }

  async loginByGoogle(
    code: string | null,
    idToken: string | null,
    redirect_uri: string | null,
  ): Promise<JWTResponse> {
    let ticketPayload: TokenPayload | undefined;
    try {
      if (idToken) {
        const ticket = await this.googleOauthClient.verifyIdToken({
          idToken: idToken,
          audience: this.configService.get<string>("GCP_OAUTH_ID"),
        });
        ticketPayload = ticket.getPayload();
      } else if (code) {
        const tokenRes = await this.googleOauthClient.getToken({
          code,
          ...(redirect_uri ? { redirect_uri } : {}),
        });
        const ticket = await this.googleOauthClient.verifyIdToken({
          idToken: tokenRes.tokens.id_token ?? "",
          audience: this.configService.get<string>("GCP_OAUTH_ID"),
        });
        ticketPayload = ticket.getPayload();
      } else {
        throw new HttpException(ErrorMsg.GoogleOauthCode_Invalid(), HttpStatus.BAD_REQUEST);
      }
    } catch (_e) {
      throw new HttpException(ErrorMsg.GoogleOauthCode_Invalid(), HttpStatus.BAD_REQUEST);
    }

    if (!ticketPayload) {
      throw new HttpException(ErrorMsg.GoogleOauthCode_Invalid(), HttpStatus.BAD_REQUEST);
    }

    let loginUser: User;
    const login = await this.loginRepository.findOne({
      where: { identifier1: ticketPayload.sub, type: "google" },
    });
    if (!login) {
      loginUser = await this.userManageService.createUser({
        loginType: "google",
        identifier1: ticketPayload.sub,
        identifier2: null,
        email: ticketPayload.email ?? "",
        picture:
          ticketPayload?.picture ||
          "https://i.pinimg.com/236x/80/f6/ce/80f6ce7b8828349aa277cf3bcb19c477.jpg",
        name: `${ticketPayload?.family_name || ""}${ticketPayload?.given_name || ""}`,
      });
    } else {
      loginUser = login.user;
    }

    if (!hasPermission(loginUser.permission, [PermissionEnum.TEACHER])) {
      const detail = await this.userManageService.checkUserDetail(loginUser.email, {
        gender: "male",
      });

      if (detail === null) {
        throw new HttpException(ErrorMsg.PersonalInformation_NotRegistered(), HttpStatus.NOT_FOUND);
      }
    }

    return await this.generateJWTKeyPair(loginUser, "30m");
  }

  // Actually, we need refresh "token" not refresh jwt
  async refresh(refreshToken: string) {
    const session = await this.sessionRepository.findOne({
      where: { refreshToken: refreshToken || "" },
    });
    if (!session) {
      throw new HttpException(ErrorMsg.UserSession_NotFound(), HttpStatus.NOT_FOUND);
    }

    const user = await this.userRepository.findOne({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return await this.generateJWTKeyPair(user, "30m", session);
  }

  async logout(user: UserJWT) {
    const session = await this.sessionRepository.findOne({
      where: { sessionIdentifier: user.sessionIdentifier || "" },
    });
    // cannot be called. if called, it's a bug. (jwt strategy should catch this)
    if (!session) {
      throw new HttpException("Cannot find valid session.", 404);
    }

    await this.sessionRepository.remove(session);

    return session;
  }

  async generatePersonalInformationVerifyToken(user: UserJWT) {
    return this.jwtService.signAsync(
      { email: user.email },
      {
        expiresIn: "1m",
        algorithm: "HS512",
        secret: await this.cacheService.getPersonalInformationVerifyTokenSecret(),
      },
    );
  }

  async generateJWTKeyPair(
    user: User,
    accessExpire: StringValue,
    old?: Session,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionIdentifier = Bun.randomUUIDv7();

    // refresh expire: 1 month
    const keyPair = {
      accessToken: await this.jwtService.signAsync(
        { sessionIdentifier, ...user },
        { expiresIn: accessExpire || "10m" },
      ),
      refreshToken: Bun.randomUUIDv7(),
    };

    const session = old || new Session();
    session.refreshToken = keyPair.refreshToken;
    session.sessionIdentifier = sessionIdentifier;
    session.user = user;
    await this.sessionRepository.save(session);

    return keyPair;
  }

  @Cron(CronExpression.EVERY_HOUR)
  // @Cron(CronExpression.EVERY_SECOND)
  private async expiredSessionClear() {
    await this.sessionRepository.delete({
      updated_at: LessThan(subMonths(new Date(), 1)),
    });
  }
}
