import { splitLastLetter } from './mothSpot';
import { PerchingMoth, type PerchingMothProps } from './PerchingMoth';

export function MothPerch({ text, ...moth }: { text: string } & PerchingMothProps) {
  const { head, last } = splitLastLetter(text);
  return (
    <>
      {head}
      <span className="tamiyo-nav-perch">
        {last}
        <PerchingMoth {...moth} />
      </span>
    </>
  );
}
