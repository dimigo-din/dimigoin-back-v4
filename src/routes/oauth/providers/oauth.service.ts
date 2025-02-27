import * as crypto from "crypto";

import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ErrorMsg } from "../../../common/mapper/error";
import { UserJWT } from "../../../common/mapper/types";
import { OAuth_Client, OAuth_Client_Redirect, OAuth_Code, User } from "../../../schemas";

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OAuth_Client)
    private readonly oauthClientRepository: Repository<OAuth_Client>,
    @InjectRepository(OAuth_Client_Redirect)
    private readonly oauthClientRedirectRepository: Repository<OAuth_Client_Redirect>,
  ) {}

  async getOauthClientList(user: UserJWT) {
    const dbUser = await this.userRepository.findOne({ where: { id: user.id } });
    const clients = await this.oauthClientRepository.find({ where: { user: dbUser } });

    return clients.map((client) => {
      return { client_id: client.client_id, name: client.name };
    });
  }

  async getOAuthClient(user: UserJWT, client_id: string) {
    const oauth_client = await this.oauthClientRepository.findOne({
      where: { client_id: client_id },
    });
    if (!oauth_client) throw new HttpException(ErrorMsg.OAuthClient_NotFound, HttpStatus.NOT_FOUND);

    if (oauth_client.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource, HttpStatus.FORBIDDEN);

    return oauth_client;
  }

  async createOAuthClient(user: UserJWT, client_name: string, redirectUrl: string[]) {
    const dbUser = await this.userRepository.findOne({ where: { id: user.id } });

    const oauth_client = new OAuth_Client();
    oauth_client.name = client_name;
    oauth_client.client_pw = crypto.randomBytes(30).toString("base64");
    oauth_client.user = dbUser;

    const dbOAuth_client = await this.oauthClientRepository.save(oauth_client);
    await this.oauthClientRedirectRepository.save(
      redirectUrl.map((redirect) => {
        const oauth_client_redirect = new OAuth_Client_Redirect();
        oauth_client_redirect.redirect_url = redirect;
        oauth_client_redirect.oauth_client = dbOAuth_client;
        return oauth_client_redirect;
      }),
    );

    return await this.oauthClientRepository.findOne({ where: { id: dbOAuth_client.id } });
  }

  async setOAuthClientRedirect(user: UserJWT, client_id: string, redirectUrl: string[]) {
    const oauth_client = await this.oauthClientRepository.findOne({
      where: { client_id: client_id },
    });
    if (!oauth_client) throw new HttpException(ErrorMsg.OAuthClient_NotFound, HttpStatus.NOT_FOUND);

    if (oauth_client.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Resource, HttpStatus.FORBIDDEN);

    await this.oauthClientRedirectRepository.remove(oauth_client.redirect);
    await this.oauthClientRedirectRepository.save(
      redirectUrl.map((redirect) => {
        const oauth_client_redirect = new OAuth_Client_Redirect();
        oauth_client_redirect.redirect_url = redirect;
        oauth_client_redirect.oauth_client = oauth_client;
        return oauth_client_redirect;
      }),
    );
  }

  async resetOAuthClientPw(user: UserJWT, client_id: string) {
    const oauth_client = await this.oauthClientRepository.findOne({
      where: { client_id: client_id },
    });
    if (!oauth_client) throw new HttpException(ErrorMsg.OAuthClient_NotFound, HttpStatus.NOT_FOUND);

    if (oauth_client.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Action, HttpStatus.FORBIDDEN);

    oauth_client.client_pw = crypto.randomBytes(30).toString("base64");
    return await this.oauthClientRepository.save(oauth_client);
  }

  async deleteOAuthClient(user: UserJWT, client_id: string) {
    const oauth_client = await this.oauthClientRepository.findOne({
      where: { client_id: client_id },
    });
    if (!oauth_client) throw new HttpException(ErrorMsg.OAuthClient_NotFound, HttpStatus.NOT_FOUND);

    if (oauth_client.user.id !== user.id)
      throw new HttpException(ErrorMsg.PermissionDenied_Action, HttpStatus.FORBIDDEN);

    return await this.oauthClientRepository.remove(oauth_client);
  }
}
