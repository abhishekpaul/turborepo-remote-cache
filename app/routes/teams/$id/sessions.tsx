import type { Team } from '@prisma/client';
import { type LoaderFunction } from 'remix';
import { TablePage } from '~/component/TablePage';
import { useSessionsTable } from '~/hooks/table/useSessionsTable';
import { useTablePageLoaderData } from '~/hooks/useTablePageLoaderData';
import { requireCookieAuth } from '~/services/authentication.server';
import { getSessionsByTeam, getSessionsByTeamCount } from '~/services/session.server';
import { getTeam } from '~/services/teams.server';
import { getPaginationFromRequest } from '~/utils/pagination';
import { getOrderByFromRequest } from '~/utils/sort';

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireCookieAuth(request);
  const { take, skip } = getPaginationFromRequest(request);
  const orderBy = getOrderByFromRequest(request);
  const [team, items, count] = await Promise.all([
    getTeam(params.id as string),
    getSessionsByTeam(params.id as string, skip, take, orderBy),
    getSessionsByTeamCount(params.id as string),
  ]);
  return {
    items,
    team,
    count,
  };
};

export default function New() {
  const { items, team, count } = useTablePageLoaderData<Awaited<ReturnType<typeof getSessionsByTeam>>[number], { team: Team }>();
  const { tableProps, paginationProps } = useSessionsTable(items, count);
  return <TablePage title={`${team.name}'s sessions`} count={count} tableProps={tableProps} paginationProps={paginationProps} />;
}