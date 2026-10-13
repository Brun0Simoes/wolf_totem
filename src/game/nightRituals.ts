import { NIGHT_PROFILES } from '../data/nocturne';
import { AVATAR_PROFILES } from '../data/avatar';
import { AVATAR_RITES } from '../data/avatarRituals';
import { PRACTICES, type PracticeId } from './tribe';

export const NIGHT_RITES: PracticeId[] = ['consecration','blood-pact','soul-forge','speaker-seal','ancestral-song','eclipse','requiem','first-blood'];
export function ritesForHero(id: number) {
  const avatar=AVATAR_PROFILES.get(id);
  if(avatar){const allowed:PracticeId[]=avatar.ability==='avatar'?AVATAR_RITES.filter(r=>r!=='warrior-path'):[avatar.rite,...(avatar.rite==='warrior-path'?[]:['spirit-balance' as PracticeId])];return PRACTICES.filter(p=>allowed.includes(p.id));}
  const profile=NIGHT_PROFILES.get(id);
  if(!profile)return PRACTICES.filter(p=>!NIGHT_RITES.includes(p.id)&&!AVATAR_RITES.includes(p.id));
  const own=profile.rite;
  const allowed:PracticeId[]=[own];
  if(['blood-pact','soul-forge'].includes(own))allowed.push('eclipse');
  if(own==='consecration')allowed.push('speaker-seal');
  if(own==='speaker-seal')allowed.push('ancestral-song');
  if(own==='ancestral-song')allowed.push('speaker-seal');
  if(own==='eclipse')allowed.push('blood-pact');
  if(own==='requiem')allowed.push('blood-pact');
  if(own==='first-blood')allowed.push('ancestral-song');
  return PRACTICES.filter(p=>allowed.includes(p.id));
}
export const deepRiteForHero = (id: number): PracticeId => AVATAR_PROFILES.get(id)?.rite ?? NIGHT_PROFILES.get(id)?.rite ?? 'ayahuasca';
type BaseRitualMode = 'rape'|'sananga'|'kambo'|'ayahuasca'|'cacau';
const ritualModes: Record<PracticeId, BaseRitualMode> = {
  rape:'rape', sananga:'sananga', kambo:'kambo', ayahuasca:'ayahuasca', cacau:'cacau',
  consecration:'sananga', 'blood-pact':'cacau', 'soul-forge':'kambo',
  'speaker-seal':'kambo', 'ancestral-song':'cacau', eclipse:'ayahuasca',
  requiem:'cacau', 'first-blood':'sananga',
  'air-discipline':'rape','water-flow':'ayahuasca','earth-root':'kambo','fire-breath':'cacau','warrior-path':'kambo','spirit-balance':'sananga','avatar-convergence':'ayahuasca',
};
export const ritualMode = (id:PracticeId): BaseRitualMode => ritualModes[id];
