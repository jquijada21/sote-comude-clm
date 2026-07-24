import ComudeDetalleClient from "./ComudeDetalleClient";

export default async function ComudeDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ComudeDetalleClient id={id} />;
}
