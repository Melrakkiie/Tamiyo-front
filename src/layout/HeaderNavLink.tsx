import { UnstyledButton } from '@mantine/core';
import { Link } from 'react-router';

import { NavMoth } from './NavMoth';

export function HeaderNavLink({ label, to, active }: { label: string; to: string; active: boolean }) {
  return (
    <UnstyledButton
      component={Link}
      to={to}
      className="tamiyo-nav-link"
      data-active={active || undefined}
      aria-current={active ? 'page' : undefined}
    >
      {active ? (
        <>
          {label.slice(0, -1)}
          <span className="tamiyo-nav-perch">
            {label.slice(-1)}
            <NavMoth />
          </span>
        </>
      ) : (
        label
      )}
    </UnstyledButton>
  );
}
