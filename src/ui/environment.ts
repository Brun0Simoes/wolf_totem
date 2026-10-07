import props from '../../public/assets/environment/village-props.json';
import { assetUrl } from '../render/animationAssets';
export const environmentProps = props;
export function environmentPortrait(kind: keyof typeof props.frames): string {
  const r = props.frames[kind];
  return `<span class="environment-portrait" style="aspect-ratio:${r.width}/${r.height}"><img src="${assetUrl(props.image)}" alt="" style="width:${props.imageWidth/r.width*100}%;height:${props.imageHeight/r.height*100}%;left:${-r.x/r.width*100}%;top:${-r.y/r.height*100}%"></span>`;
}
