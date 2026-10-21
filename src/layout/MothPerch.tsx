import { splitLastLetter } from './mothSpot';
import { NavMoth, type NavMothProps } from './NavMoth';

// The text, with the moth perched on its last letter.
export function MothPerch({ text, ...moth }: { text: string } & NavMothProps) {
  const { head, last } = splitLastLetter(text);
  return (
    <>
      {head}
      <span className="tamiyo-nav-perch">
        {last}
        <NavMoth {...moth} />
      </span>
    </>
  );
}
