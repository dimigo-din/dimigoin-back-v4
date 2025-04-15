import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { Repository } from "typeorm";
import { v4 as uuid } from "uuid";

import { ErrorMsg } from "../common/mapper/error";
import { UserJWT } from "../common/mapper/types";
import { UserManageService } from "../routes/user/providers";
import { Login, Session, User } from "../schemas";

import { JWTResponse } from "./auth.dto";

@Injectable()
export class AuthService {
  googleOauthClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
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
    this.googleOauthClient = new google.auth.OAuth2(
      configService.get<string>("GCP_OAUTH_ID"),
      configService.get<string>("GCP_OAUTH_SECRET"),
      `${configService.get<string>("APPLICATION_HOST")}/auth/login/google/callback`,
    );
  }

  async loginByIdPassword(id: string, password: string) {
    const login = await this.loginRepository.findOne({
      where: { identifier1: id || "" },
    });
    if (!login) throw new HttpException(ErrorMsg.UserIdentifier_NotFound, 403);
    if (!bcrypt.compareSync(password, login.identifier2))
      throw new HttpException(ErrorMsg.UserIdentifier_NotMatched, 403);

    return await this.generateJWTKeyPair(login.user, "30m");
  }

  async getGoogleLoginUrl(): Promise<string> {
    const scopes: string[] = [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ];
    return this.googleOauthClient.generateAuthUrl({
      response_type: "code",
      access_type: "online",
      prompt: "consent",
      scope: scopes,
    });
  }

  async loginByGoogle(code: string): Promise<JWTResponse> {
    // google OAuth process
    let ticketPayload;
    try {
      const tokenRes = await this.googleOauthClient.getToken(code);
      const ticket = await this.googleOauthClient.verifyIdToken({
        idToken: tokenRes.tokens.id_token,
      });
      ticketPayload = ticket.getPayload();
    } catch (e) {
      throw new HttpException(ErrorMsg.GoogleOauthCode_Invalid, HttpStatus.BAD_REQUEST);
    }

    let loginUser = null;
    const login = await this.loginRepository.findOne({
      where: { identifier1: ticketPayload.sub || "" },
    });
    if (!login) {
      loginUser = await this.userManageService.createUser({
        loginType: "google",
        identifier1: ticketPayload.sub,
        identifier2: null,
        email: ticketPayload.email,
        name: `${ticketPayload.family_name}${ticketPayload.given_name}`,
      });
    } else loginUser = login.user;

    return await this.generateJWTKeyPair(loginUser, "30m");
  }

  // Actually, we need refresh "token" not refresh jwt
  async refresh(refreshToken: string) {
    const session = await this.sessionRepository.findOne({
      where: { refreshToken: refreshToken || "" },
    });
    if (!session)
      throw new HttpException(
        "Session not found. Is this valid jwt refresh token?",
        HttpStatus.NOT_FOUND,
      );

    await this.sessionRepository.remove(session);

    const user = await this.userRepository.findOne({
      where: { id: session.user.id },
    });

    return await this.generateJWTKeyPair(user, "30m");
  }

  async logout(user: UserJWT) {
    const session = await this.sessionRepository.findOne({
      where: { sessionIdentifier: user.sessionIdentifier || "" },
    });
    // cannot be called. if called, it's a bug. (jwt strategy should catch this)
    if (!session) throw new HttpException("Cannot find valid session.", 404);

    await this.sessionRepository.delete(session);

    return session;
  }

  async generateJWTKeyPair(
    user: User,
    accessExpire: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionIdentifier = uuid().replaceAll("-", "");

    const userDetail = await this.userManageService.fetchUserDetail({ email: user.email });

    const keyPair = {
      accessToken: await this.jwtService.signAsync(
        { sessionIdentifier, ...user, ...userDetail, refresh: false },
        { expiresIn: accessExpire || "10m" },
      ),
      refreshToken: uuid(),
    };

    // TODO: separate to redis
    // Oh i think we don't need that.
    // new TODO: cron that clears expired tokens
    const session = new Session();
    session.accessToken = keyPair.accessToken;
    session.refreshToken = keyPair.refreshToken;
    session.sessionIdentifier = sessionIdentifier;
    session.user = user;
    await this.sessionRepository.save(session);

    return keyPair;
  }
}
