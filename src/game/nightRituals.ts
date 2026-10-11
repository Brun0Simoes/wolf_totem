import { NIGHT_PROFILES } from '../data/nocturne';
import { PRACTICES, type PracticeId } from './tribe';

export const NIGHT_RITES: PracticeId[] = ['consecration','blood-pact','soul-forge','speaker-seal','ancestral-song','eclipse'];
export function ritesForHero(id: number) {
  const profile=NIGHT_PROFILES.get(id);
  if(!profile)return PRACTICES.filter(p=>!NIGHT_RITES.includes(p.id));
  const own=profile.rite;
  const allowed:PracticeId[]=[own];
  if(['blood-pact','soul-forge'].includes(own))allowed.push('eclipse');
  if(own==='consecration')allowed.push('speaker-seal');
  if(own==='speaker-seal')allowed.push('ancestral-song');
  if(own==='ancestral-song')allowed.push('speaker-seal');
  if(own==='eclipse')allowed.push('blood-pact');
  return PRACTICES.filter(p=>allowed.includes(p.id));
}
export const deepRiteForHero = (id: number): PracticeId => NIGHT_PROFILES.get(id)?.rite ?? 'ayahuasca';
type BaseRitualMode = 'rape'|'sananga'|'kambo'|'ayahuasca'|'cacau';
const ritualModes: Record<PracticeId, BaseRitualMode> = {
  rape:'rape', sananga:'sananga', kambo:'kambo', ayahuasca:'ayahuasca', cacau:'cacau',
  consecration:'sananga', 'blood-pact':'cacau', 'soul-forge':'kambo',
  'speaker-seal':'kambo', 'ancestral-song':'cacau', eclipse:'ayahuasca',
};
export const ritualMode = (id:PracticeId): BaseRitualMode => ritualModes[id];
