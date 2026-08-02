type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserProfile({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="pt-8">
      <p>My user Profile {id}</p>
    </div>
  );
}
