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
import { subMonths } from "date-fns";
import { eq, lt } from "drizzle-orm";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import { StringValue } from "ms";
import { session, user } from "#/db/schema";
import { JWTResponse, RedirectUriDTO } from "#auth/auth.dto";
import { ErrorMsg } from "$mapper/error";
import { PermissionEnum } from "$mapper/permissions";
import { UserJWT } from "$mapper/types";
import { CacheService } from "$modules/cache.module";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { hasPermission } from "$utils/permission.util";
import { UserManageService } from "~user/providers";

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
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
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
    const loginRecord = await this.db.query.login.findFirst({
      where: { RAW: (t, { and, eq }) => and(eq(t.identifier1, id || ""), eq(t.type, "password")) },
      with: { user: true },
    });
    if (!loginRecord) {
      throw new HttpException(ErrorMsg.UserIdentifier_NotFound(), HttpStatus.UNAUTHORIZED);
    }
    if (!Bun.password.verify(password, loginRecord.identifier2 ?? "")) {
      throw new HttpException(ErrorMsg.UserIdentifier_NotMatched(), HttpStatus.UNAUTHORIZED);
    }

    const loginUser =
      loginRecord.user ??
      (await this.db.query.user.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, loginRecord.userId) },
      }));

    if (!loginUser) {
      throw new HttpException(ErrorMsg.UserIdentifier_NotFound(), HttpStatus.UNAUTHORIZED);
    }

    return await this.generateJWTKeyPair(loginUser, "30m");
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

    let loginUser: typeof user.$inferSelect;
    const loginRecord = await this.db.query.login.findFirst({
      where: {
        RAW: (t, { and, eq }) => and(eq(t.identifier1, ticketPayload.sub), eq(t.type, "google")),
      },
      with: { user: true },
    });
    if (!loginRecord) {
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
      const existingUser =
        loginRecord.user ??
        (await this.db.query.user.findFirst({
          where: { RAW: (t, { eq }) => eq(t.id, loginRecord.userId) },
        }));

      if (!existingUser) {
        throw new HttpException(ErrorMsg.UserIdentifier_NotFound(), HttpStatus.UNAUTHORIZED);
      }

      loginUser = existingUser;
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

  async refresh(refreshToken: string) {
    const sessionRecord = await this.db.query.session.findFirst({
      where: { RAW: (t, { eq }) => eq(t.refreshToken, refreshToken || "") },
      with: { user: true },
    });
    if (!sessionRecord) {
      throw new HttpException(ErrorMsg.UserSession_NotFound(), HttpStatus.NOT_FOUND);
    }

    const sessionUserId = sessionRecord.user?.id ?? sessionRecord.userId;
    if (!sessionUserId) {
      throw new NotFoundException("User not found");
    }

    const userRecord = await this.db.query.user.findFirst({
      where: { RAW: (t, { eq }) => eq(t.id, sessionUserId) },
    });

    if (!userRecord) {
      throw new NotFoundException("User not found");
    }

    return await this.generateJWTKeyPair(userRecord, "30m", sessionRecord);
  }

  async logout(userJwt: UserJWT) {
    const sessionRecord = await this.db.query.session.findFirst({
      where: { RAW: (t, { eq }) => eq(t.sessionIdentifier, userJwt.sessionIdentifier || "") },
    });
    if (!sessionRecord) {
      throw new HttpException("Cannot find valid session.", 404);
    }

    await this.db.delete(session).where(eq(session.id, sessionRecord.id));

    return sessionRecord;
  }

  async generatePersonalInformationVerifyToken(userJwt: UserJWT) {
    return this.jwtService.signAsync(
      { email: userJwt.email },
      {
        expiresIn: "1m",
        algorithm: "HS512",
        secret: await this.cacheService.getPersonalInformationVerifyTokenSecret(),
      },
    );
  }

  async generateJWTKeyPair(
    userRecord: typeof user.$inferSelect,
    accessExpire: StringValue,
    old?: typeof session.$inferSelect,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionIdentifier = Bun.randomUUIDv7();

    const keyPair = {
      accessToken: await this.jwtService.signAsync(
        { sessionIdentifier, ...userRecord },
        { expiresIn: accessExpire || "10m" },
      ),
      refreshToken: Bun.randomUUIDv7(),
    };

    if (old) {
      await this.db
        .update(session)
        .set({
          refreshToken: keyPair.refreshToken,
          sessionIdentifier,
          userId: userRecord.id,
        })
        .where(eq(session.id, old.id));
    } else {
      await this.db.insert(session).values({
        refreshToken: keyPair.refreshToken,
        sessionIdentifier,
        userId: userRecord.id,
      });
    }

    return keyPair;
  }

  @Cron(CronExpression.EVERY_HOUR)
  private async expiredSessionClear() {
    await this.db.delete(session).where(lt(session.updated_at, subMonths(new Date(), 1)));
  }
}
