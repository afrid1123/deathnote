
import NoteEditor from './NoteEditor';

export const instant = false;

export default async function NotePage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;

  return <NoteEditor room={room} />;
}
