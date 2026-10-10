/// <reference types="vite/client" />

declare module 'virtual:wolf-animations' {
  export const heroes: import('./render/animationModel').SheetDefinition[];
  export const summons: import('./render/animationModel').SheetDefinition[];
}
declare module 'virtual:wolf-environment' {
  type Atlas={image:string;imageWidth:number;imageHeight:number;frames:Record<string,{x:number;y:number;width:number;height:number}>};
  export const props:Atlas;
  export const fx:Atlas;
  export const spellAtlas:Pick<Atlas,'image'|'frames'> & {width:number;height:number};
}
