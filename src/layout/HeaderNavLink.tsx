import { UnstyledButton } from '@mantine/core';
import { Link } from 'react-router';

import { MothPerch } from './MothPerch';

export function HeaderNavLink({
  label,
  to,
  active,
  withMoth = true,
}: {
  label: string;
  to: string;
  active: boolean;
  withMoth?: boolean;
}) {
  return (
    <UnstyledButton
      component={Link}
      to={to}
      className="tamiyo-nav-link"
      data-active={active || undefined}
      aria-current={active ? 'page' : undefined}
    >
      {active && withMoth ? <MothPerch text={label} trigger=".tamiyo-nav-link" focusTakeOff /> : label}
    </UnstyledButton>
  );
}
