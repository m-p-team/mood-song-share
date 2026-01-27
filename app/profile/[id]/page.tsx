type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold">Profile Page: {id}</h1>
    </main>
  );
}
