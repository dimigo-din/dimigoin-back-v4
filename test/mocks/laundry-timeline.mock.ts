import {
  CreateLaundryTimelineDTO,
  LaundryTimeDTO,
} from "../../src/routes/laundry/dto/laundry.manage.dto";

export const LaundryTimelineMock = (machines: string[]) => {
  const laundryTimeline = new CreateLaundryTimelineDTO();
  laundryTimeline.name = "평상시";
  laundryTimeline.triggeredOn = "primary";
  laundryTimeline.times = [];

  const laundryTime = new LaundryTimeDTO();
  laundryTime.time = "18:30";
  laundryTime.grade = 1;
  laundryTime.assigns = machines;
  laundryTimeline.times.push(laundryTime);

  return laundryTimeline;
};
