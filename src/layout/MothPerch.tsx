import { splitLastSymbol } from './mothSpot';
import { PerchingMoth, type PerchingMothProps } from './PerchingMoth';

export function MothPerch({ text, ...moth }: { text: string } & PerchingMothProps) {
  const { head, last, tail } = splitLastSymbol(text);
  // One element, so React removes the text in one go, after the moth's cleanup measured where it sat.
  return (
    <span>
      {head}
      <span className="tamiyo-nav-perch">
        {last}
        <PerchingMoth {...moth} />
      </span>
      {tail}
    </span>
  );
}
