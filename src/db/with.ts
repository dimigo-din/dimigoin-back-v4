export const laundryTimeWithAssignIds = {
  assigns: {
    with: {
      laundryMachine: true,
      laundryTime: true,
    },
  },
} as const;

export const laundryTimelineWithAssignIds = {
  times: {
    with: laundryTimeWithAssignIds,
  },
} as const;

export const laundryTimelineForStudentTimeline = {
  times: {
    with: {
      timeline: true,
      assigns: {
        columns: {
          laundryMachineId: true,
          laundryTimeId: true,
        },
        with: {
          laundryMachine: {
            with: {
              assigns: {
                with: {
                  laundryTime: true,
                },
              },
            },
          },
          laundryTime: true,
        },
      },
    },
  },
} as const;

export const laundryApplyWithTimeAndMachine = {
  laundryTime: true,
  laundryMachine: true,
} as const;

export const frigoApplyWithUser = {
  user: true,
} as const;

export const pushSubjectWithSubscription = {
  subscription: true,
} as const;

export const pushSubscriptionWithSubjects = {
  subjects: true,
} as const;

export const wakeupSongApplicationWithVotes = {
  wakeupSongVote: true,
} as const;

export const wakeupSongApplicationWithVotesAndUser = {
  wakeupSongVote: true,
  user: true,
} as const;

export const wakeupSongVoteWithApplication = {
  wakeupSongApplication: true,
} as const;

export const facilityReportWithUser = {
  user: true,
} as const;

export const facilityReportWithCommentFileUser = {
  comment: true,
  file: true,
  user: true,
} as const;

export const facilityReportWithFileUser = {
  file: true,
  user: true,
} as const;

export const staySeatPresetWithRange = {
  staySeatPresetRange: true,
} as const;

export const stayScheduleWithPresetAndApplyPeriod = {
  staySeatPreset: { with: staySeatPresetWithRange },
  stayApplyPeriodStaySchedule: true,
} as const;

export const stayWithPresetAndApplyPeriod = {
  staySeatPreset: { with: staySeatPresetWithRange },
  stayApplyPeriodStay: true,
} as const;

export const stayApplyWithUserAndOuting = {
  user: true,
  outing: true,
} as const;

export const stayWithApplyPeriodAndApplyUserAndPresetRange = {
  stayApplyPeriodStay: true,
  stayApply: {
    with: {
      user: true,
    },
  },
  staySeatPreset: {
    with: staySeatPresetWithRange,
  },
} as const;

export const stayApplyWithUserOutingAndStayWithPresetAndApplyPeriod = {
  user: true,
  outing: true,
  stay: {
    with: stayWithPresetAndApplyPeriod,
  },
} as const;

export const stayApplyWithUserAndStayWithApplyPeriod = {
  stay: {
    with: {
      stayApplyPeriodStay: true,
    },
  },
  user: true,
} as const;

export const stayOutingWithStayApplyUserAndStayWithApplyPeriod = {
  stayApply: {
    with: {
      user: true,
      stay: {
        with: {
          stayApplyPeriodStay: true,
        },
      },
    },
  },
} as const;

export const stayScheduleWithSeatPresetAndPeriod = {
  staySeatPreset: true,
  stayApplyPeriodStaySchedule: true,
} as const;

export const stayWithParentAndApplyPeriod = {
  parent: true,
  stayApplyPeriodStay: true,
} as const;

export const stayWithApplyAndOuting = {
  stayApply: {
    with: {
      outing: true,
    },
  },
} as const;
