import { isNightCharacter } from './nocturne';
import { isAvatarCharacter } from './avatar';

export const AVATAR_UNLOCK_REBIRTHS=2;
export type CharacterCollection='primal'|'night'|'avatar';
export const collectionFor=(id:number):CharacterCollection=>isAvatarCharacter(id)?'avatar':isNightCharacter(id)?'night':'primal';
export const characterUnlocked=(id:number,rebirths:number)=>rebirths>=(collectionFor(id)==='avatar'?AVATAR_UNLOCK_REBIRTHS:collectionFor(id)==='night'?1:0);
export const characterUnlockLabel=(id:number)=>collectionFor(id)==='avatar'?(AVATAR_UNLOCK_REBIRTHS===2?'Segundo reset':'Primeiro reset'):'Primeiro reset';
export const characterUnlockMessage=(id:number)=>collectionFor(id)==='avatar'?`As Quatro Nações abrem após ${AVATAR_UNLOCK_REBIRTHS} renascimentos.`:'O Véu da Noite abre após o primeiro renascimento.';
