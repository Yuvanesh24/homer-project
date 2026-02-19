import { addDays, format } from 'date-fns';
import { prisma } from '../index';
import { GroupType, EventStatus } from '@prisma/client';

interface StudyEventTemplate {
  eventName: string;
  eventType: string;
  studyDay: number;
}

const INTERVENTION_EVENTS: StudyEventTemplate[] = [
  { eventName: 'Device Installation', eventType: 'device_install', studyDay: 0 },
  { eventName: 'Robotic Therapy + ADL - Day 1', eventType: 'therapy', studyDay: 1 },
  { eventName: 'Robotic Therapy + ADL - Day 2', eventType: 'therapy', studyDay: 2 },
  { eventName: 'Robotic Therapy + ADL - Day 3', eventType: 'therapy', studyDay: 3 },
  { eventName: 'Follow-up Phone Call', eventType: 'phone_call', studyDay: 7 },
  { eventName: 'Watch Swap Reminder', eventType: 'reminder', studyDay: 14 },
  { eventName: 'Home Visit + Watch Swap', eventType: 'home_visit', studyDay: 15 },
  { eventName: 'Trial Completion', eventType: 'completion', studyDay: 28 },
  { eventName: 'Device & Watch Retrieval', eventType: 'retrieval', studyDay: 29 },
];

const CONTROL_EVENTS: StudyEventTemplate[] = [
  { eventName: 'Manual Exercise + ADL - Day 1', eventType: 'therapy', studyDay: 1 },
  { eventName: 'Manual Exercise + ADL - Day 2', eventType: 'therapy', studyDay: 2 },
  { eventName: 'Manual Exercise + ADL - Day 3', eventType: 'therapy', studyDay: 3 },
  { eventName: 'Follow-up Phone Call', eventType: 'phone_call', studyDay: 7 },
  { eventName: 'Watch Swap Reminder', eventType: 'reminder', studyDay: 14 },
  { eventName: 'Watch Swap Visit', eventType: 'home_visit', studyDay: 15 },
  { eventName: 'Trial Completion', eventType: 'completion', studyDay: 28 },
  { eventName: 'Watch Retrieval', eventType: 'retrieval', studyDay: 29 },
];

export const generatePatientId = async (groupType: GroupType): Promise<string> => {
  const prefix = groupType === 'intervention' ? 'INT' : 'CTL';
  const count = await prisma.patient.count({
    where: { groupType },
  });
  const number = count + 1;
  return `${prefix}-${String(number).padStart(3, '0')}`;
};

export const generateStudyEvents = async (
  patientId: string,
  studyStartDate: Date,
  groupType: GroupType
): Promise<void> => {
  const events = groupType === 'intervention' ? INTERVENTION_EVENTS : CONTROL_EVENTS;

  const eventData = events.map((event) => ({
    patientId,
    eventName: event.eventName,
    eventType: event.eventType,
    studyDay: event.studyDay,
    scheduledDate: addDays(studyStartDate, event.studyDay),
    status: 'pending' as EventStatus,
  }));

  await prisma.studyEvent.createMany({
    data: eventData,
  });
};

export const regenerateStudyEvents = async (
  patientId: string,
  studyStartDate: Date,
  groupType: GroupType
): Promise<void> => {
  await prisma.studyEvent.deleteMany({
    where: { patientId, status: 'pending' },
  });

  await generateStudyEvents(patientId, studyStartDate, groupType);
};

export const cancelFutureEvents = async (patientId: string): Promise<void> => {
  const today = new Date();
  await prisma.studyEvent.updateMany({
    where: {
      patientId,
      scheduledDate: { gt: today },
      status: 'pending',
    },
    data: {
      status: 'cancelled',
    },
  });
};

export const getStudyDay = (studyStartDate: Date, currentDate: Date = new Date()): number => {
  const diffTime = currentDate.getTime() - studyStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};
