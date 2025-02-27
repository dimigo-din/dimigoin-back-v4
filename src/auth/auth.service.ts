import * as crypto from "crypto";

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
import { UserService } from "../routes/user/providers";
import { Login, OAuth_Client, OAuth_Client_Redirect, OAuth_Code, Session, User } from "../schemas";

@Injectable()
export class AuthService {
  googleOauthClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Login)
    private readonly loginRepository: Repository<Login>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(OAuth_Client)
    private readonly oauthClientRepository: Repository<OAuth_Client>,
    @InjectRepository(OAuth_Client_Redirect)
    private readonly oauthClientRedirectRepository: Repository<OAuth_Client_Redirect>,
    @InjectRepository(OAuth_Code)
    private readonly oauthCodeRepository: Repository<OAuth_Code>,
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

    return await this.generateJWTKeyPair(login.user, "30m", "1M");
  }

  async getGoogleLoginUrl(client_id: string, callback: string, state: string): Promise<string> {
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
      state: Buffer.from(JSON.stringify({ client_id, callback, state })).toString("base64url"),
    });
  }

  async loginByGoogle(code: string, state: string) {
    // google OAuth process
    const tokenRes = await this.googleOauthClient.getToken(code);
    const ticket = await this.googleOauthClient.verifyIdToken({
      idToken: tokenRes.tokens.id_token,
    });
    const ticketPayload = ticket.getPayload();

    let loginUser = null;
    const login = await this.loginRepository.findOne({
      where: { identifier1: ticketPayload.sub || "" },
    });
    if (!login) {
      loginUser = await this.userService.createUser({
        loginType: "google",
        identifier1: ticketPayload.sub,
        identifier2: null,
        email: ticketPayload.email,
        name: `${ticketPayload.family_name}${ticketPayload.given_name}`,
      });
    } else loginUser = login.user;

    // dimigoin OAuth process
    const decodedState = JSON.parse(Buffer.from(state, "base64url").toString());
    if (!decodedState.client_id || isNaN(decodedState.client_id) || !decodedState.callback)
      throw new HttpException(ErrorMsg.InvalidParameter, HttpStatus.BAD_REQUEST);

    const oauth_client = await this.oauthClientRepository.findOne({
      where: { client_id: decodedState.client_id },
    });
    if (!oauth_client) throw new HttpException(ErrorMsg.OAuthClient_NotFound, HttpStatus.NOT_FOUND);

    const redirectCheck = oauth_client.redirect.some(
      (redirect) => redirect.redirect_url === decodedState.callback,
    );
    if (!redirectCheck)
      throw new HttpException(ErrorMsg.OAuthRedirectUri_MissMatch, HttpStatus.NOT_ACCEPTABLE);

    // code generating
    const rString = crypto.randomBytes(30).toString("base64");
    const oauth_code = new OAuth_Code();
    oauth_code.code = rString;
    oauth_code.oauth_user = loginUser;
    oauth_code.oauth_client = oauth_client;

    await this.oauthCodeRepository.save(oauth_code);

    return rString;
  }

  async oauthCodeExchange(client_id: string, client_pw: string, code: string) {
    const dbCode = await this.oauthCodeRepository.findOne({ where: { code: code } });
    if (!dbCode) return new HttpException(ErrorMsg.Resource_NotFound, HttpStatus.NOT_FOUND);
    if (
      dbCode.oauth_client.client_id.toString() !== client_id.toString() ||
      dbCode.oauth_client.client_pw !== client_pw
    )
      throw new HttpException(ErrorMsg.PermissionDenied_Resource, HttpStatus.FORBIDDEN);

    await this.oauthCodeRepository.remove(dbCode);

    return await this.generateJWTKeyPair(dbCode.oauth_user, "30m", "1M");
  }

  async refresh(refreshToken: string) {
    const session = await this.sessionRepository.findOne({
      where: { refreshToken: refreshToken || "" },
    });
    if (!session)
      throw new HttpException("Session not found. Is this valid jwt refresh token?", 404);

    await this.sessionRepository.remove(session);

    const user = await this.userRepository.findOne({
      where: { id: session.user.id },
    });

    return await this.generateJWTKeyPair(user, "30m", "1M");
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
    refreshExpire: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const sessionIdentifier = uuid().replaceAll("-", "");

    const keyPair = {
      accessToken: await this.jwtService.signAsync(
        { sessionIdentifier, ...user, refresh: false },
        { expiresIn: accessExpire || "10m" },
      ),
      refreshToken: await this.jwtService.signAsync(
        { sessionIdentifier, id: user.id, refresh: true },
        { expiresIn: refreshExpire || "5h" },
      ),
    };

    // TODO: separate to redis
    const session = new Session();
    session.accessToken = keyPair.accessToken;
    session.refreshToken = keyPair.refreshToken;
    session.sessionIdentifier = sessionIdentifier;
    session.user = user;
    await this.sessionRepository.save(session);

    return keyPair;
  }
}
