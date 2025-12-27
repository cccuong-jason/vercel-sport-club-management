import { z } from 'zod'

export const EventSchema = z.object({
  title: z.string().min(2),
  type: z.enum(['training', 'match']),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().min(2)
})

export const VoteSchema = z.object({
  first: z.string(),
  firstReasons: z.array(z.string()),
  firstOtherReason: z.string().optional(),
  
  second: z.string(),
  secondReasons: z.array(z.string()),
  secondOtherReason: z.string().optional(),
  
  third: z.string(),
  thirdReasons: z.array(z.string()),
  thirdOtherReason: z.string().optional(),
}).refine((v) => v.first !== v.second && v.first !== v.third && v.second !== v.third, {
  message: 'Selections must be unique. You cannot select the same player for multiple ranks.'
})
