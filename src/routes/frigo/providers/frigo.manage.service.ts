import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { format, startOfWeek } from "date-fns";
import { eq } from "drizzle-orm";
import { frigoApply, frigoApplyPeriod } from "#/db/schema";
import { ErrorMsg } from "$mapper/error";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { andWhere } from "$utils/where.util";
import {
  AuditFrigoApply,
  FrigoApplyDTO,
  FrigoApplyIdDTO,
  FrigoApplyPeriodIdDTO,
  SetFrigoApplyPeriodDTO,
} from "~frigo/dto/frigo.manage.dto";

@Injectable()
export class FrigoManageService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async getApplyPeriod() {
    return await this.db.query.frigoApplyPeriod.findMany();
  }

  async setApplyPeriod(data: SetFrigoApplyPeriodDTO) {
    const exists = await this.db.query.frigoApplyPeriod.findFirst({
      where: { RAW: (t, { eq }) => eq(t.grade, data.grade) },
    });

    if (exists) {
      const [updated] = await this.db
        .update(frigoApplyPeriod)
        .set({
          apply_start_day: data.apply_start_day,
          apply_end_day: data.apply_end_day,
          apply_start_hour: data.apply_start_hour,
          apply_end_hour: data.apply_end_hour,
          grade: data.grade,
        })
        .where(eq(frigoApplyPeriod.id, exists.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(frigoApplyPeriod)
      .values({
        apply_start_day: data.apply_start_day,
        apply_end_day: data.apply_end_day,
        apply_start_hour: data.apply_start_hour,
        apply_end_hour: data.apply_end_hour,
        grade: data.grade,
      })
      .returning();
    return created;
  }

  async removeApplyPeriod(data: FrigoApplyPeriodIdDTO) {
    const period = await findOrThrow(
      this.db.query.frigoApplyPeriod.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    await this.db.delete(frigoApplyPeriod).where(eq(frigoApplyPeriod.id, period.id));

    return period;
  }

  async getApplyList() {
    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    return await this.db.query.frigoApply.findMany({
      where: { RAW: (t, { eq }) => eq(t.week, week) },
      with: { user: true },
    });
  }

  // considering: separate update and apply
  async apply(data: FrigoApplyDTO) {
    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, data.user) } }),
    );

    const week = format(startOfWeek(new Date()), "yyyy-MM-dd");
    const exists = await this.db.query.frigoApply.findFirst({
      where: { RAW: (t, { and, eq }) => andWhere(and, eq(t.week, week), eq(t.userId, dbUser.id)) },
    });

    if (exists) {
      const [updated] = await this.db
        .update(frigoApply)
        .set({
          timing: data.timing,
          reason: data.reason,
          approved: true,
        })
        .where(eq(frigoApply.id, exists.id))
        .returning();
      if (!updated) {
        throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
      }
      return await findOrThrow(
        this.db.query.frigoApply.findFirst({
          where: { RAW: (t, { eq }) => eq(t.id, updated.id) },
          with: { user: true },
        }),
      );
    }

    const [created] = await this.db
      .insert(frigoApply)
      .values({
        timing: data.timing,
        reason: data.reason,
        week: week,
        userId: dbUser.id,
        approved: true,
      })
      .returning();
    if (!created) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }
    return await findOrThrow(
      this.db.query.frigoApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, created.id) },
        with: { user: true },
      }),
    );
  }

  async removeApply(data: FrigoApplyIdDTO) {
    const apply = await findOrThrow(
      this.db.query.frigoApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: { user: true },
      }),
    );

    await this.db.delete(frigoApply).where(eq(frigoApply.id, apply.id));

    return apply;
  }

  async auditApply(data: AuditFrigoApply) {
    const apply = await findOrThrow(
      this.db.query.frigoApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: { user: true },
      }),
    );

    const [updated] = await this.db
      .update(frigoApply)
      .set({
        audit_reason: data.audit_reason,
        approved: data.approved,
      })
      .where(eq(frigoApply.id, apply.id))
      .returning();

    if (!updated) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }
    return await findOrThrow(
      this.db.query.frigoApply.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, updated.id) },
        with: { user: true },
      }),
    );
  }
}
