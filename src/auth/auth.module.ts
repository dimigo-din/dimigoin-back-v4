import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserModule } from "#/routes";
import { Login, Session, User } from "#/schemas";
import { AuthController } from "#auth/auth.controller";
import { AuthService } from "#auth/auth.service";
import { CustomCacheModule } from "$modules/cache.module";
import { CustomConfigModule } from "$modules/config.module";
import { CustomJWTModule } from "$modules/jwt.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Login, Session, User]),
    CustomJWTModule,
    CustomConfigModule,
    CustomCacheModule,
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
