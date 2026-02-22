import { addDays, format } from 'date-fns';
import { prisma } from '../index';
import { GroupType, EventStatus } from '@prisma/client';

interface StudyEventTemplate {
  eventName: string;
  eventType: string;
  studyDay: number;
}

const INTERVENTION_EVENTS: StudyEventTemplate[] = [
  { eventName: 'Baseline Assessment', eventType: 'assessment', studyDay: -1 },
  { eventName: 'Device Installation', eventType: 'device_install', studyDay: 0 },
  { eventName: 'Robotic Therapy + ADL ', eventType: 'therapy', studyDay: 1 },
  { eventName: 'Robotic Therapy + ADL ', eventType: 'therapy', studyDay: 2 },
  { eventName: 'Robotic Therapy + ADL ', eventType: 'therapy', studyDay: 3 },
  { eventName: 'Follow-up Phone Call ', eventType: 'phone_call', studyDay: 7 },
  { eventName: 'Watch Swap Reminder + Follow-up Call', eventType: 'reminder', studyDay: 14 },
  { eventName: 'Home Visit + Watch Swap', eventType: 'home_visit', studyDay: 15 },
  { eventName: 'Follow-up Phone Call', eventType: 'phone_call', studyDay: 21 },
  { eventName: 'Trial Completion', eventType: 'completion', studyDay: 28 },
  { eventName: 'Device & Watch Retrieval', eventType: 'retrieval', studyDay: 29 },
  { eventName: 'Follow-up Assessment', eventType: 'assessment', studyDay: 30 },
  { eventName: 'Final Assessment', eventType: 'assessment', studyDay: 180 },
];

const CONTROL_EVENTS: StudyEventTemplate[] = [
  { eventName: 'Baseline Assessment', eventType: 'assessment', studyDay: 0 },
  { eventName: 'Manual Exercise + ADL ', eventType: 'therapy', studyDay: 1 },
  { eventName: 'Manual Exercise + ADL ', eventType: 'therapy', studyDay: 2 },
  { eventName: 'Manual Exercise + ADL ', eventType: 'therapy', studyDay: 3 },
  { eventName: 'Follow-up Phone Call ', eventType: 'phone_call', studyDay: 7 },
  { eventName: 'Watch Swap Reminder + Follow-up Call ', eventType: 'reminder', studyDay: 14 },
  { eventName: 'Watch Swap Visit', eventType: 'home_visit', studyDay: 15 },
  { eventName: 'Follow-up Phone Call ', eventType: 'phone_call', studyDay: 21 },
  { eventName: 'Trial Completion', eventType: 'completion', studyDay: 28 },
  { eventName: 'Watch Retrieval', eventType: 'retrieval', studyDay: 29 },
  { eventName: 'Follow-up Assessment', eventType: 'assessment', studyDay: 30 },
  { eventName: 'Final Assessment', eventType: 'assessment', studyDay: 180 },
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
  groupType: GroupType,
  a0Date?: Date | null
): Promise<void> => {
  const events = groupType === 'intervention' ? INTERVENTION_EVENTS : CONTROL_EVENTS;
  
  const a0ScheduledDate = a0Date || (groupType === 'intervention' 
    ? addDays(studyStartDate, -1) 
    : studyStartDate);

  const eventData = events.map((event) => {
    let scheduledDate: Date;
    
    if (event.eventType === 'assessment') {
      if (event.studyDay === -1) {
        scheduledDate = a0Date || addDays(studyStartDate, -1);
      } else if (event.studyDay === 0 && groupType === 'control') {
        scheduledDate = a0Date || studyStartDate;
      } else if (event.studyDay === 30) {
        scheduledDate = addDays(studyStartDate, 30);
      } else if (event.studyDay === 180) {
        scheduledDate = a0Date ? addDays(a0Date, 180) : addDays(studyStartDate, 180);
      } else {
        scheduledDate = addDays(studyStartDate, event.studyDay);
      }
    } else {
      scheduledDate = addDays(studyStartDate, event.studyDay);
    }
    
    return {
      patientId,
      eventName: event.eventName,
      eventType: event.eventType,
      studyDay: event.studyDay,
      scheduledDate,
      status: 'pending' as EventStatus,
    };
  });

  await prisma.studyEvent.createMany({
    data: eventData,
  });
};

export const regenerateStudyEvents = async (
  patientId: string,
  studyStartDate: Date,
  groupType: GroupType,
  a0Date?: Date | null
): Promise<void> => {
  await prisma.studyEvent.deleteMany({
    where: { patientId, status: 'pending' },
  });

  await generateStudyEvents(patientId, studyStartDate, groupType, a0Date);
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
