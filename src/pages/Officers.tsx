import { PageHeader, Card, Pill } from "../components/Ui";
import officers from "../data/officers.json";

export default function Officers() {
  return (
    <div>
      <PageHeader eyebrow="Officers" title="회장단 프로필" desc="90명의 살림을 맡고 있는 사람들." />
      <div className="grid gap-4 sm:grid-cols-2">
        {officers.map((o) => {
          const displayInitial = o.name.replace(/^\d+(\.\d+)?기\s*/, "")[0] ?? o.name[0];
          return (
            <Card key={o.id} className="flex items-center gap-4">
              <div className="aspect-square w-24 shrink-0 overflow-hidden rounded-2xl bg-afterglow-2">
                {o.photo ? (
                  <img
                    src={o.photo}
                    alt={o.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-3xl text-wind-gold">
                    {displayInitial}
                  </div>
                )}
              </div>
              <div>
                <Pill tone="gold">{o.role}</Pill>
                <p className="mt-2 font-display text-lg text-backstage">{o.name}</p>
                <p className="mt-0.5 font-mono text-xs text-dawn-teal">{o.part}</p>
                <p className="mt-2 text-sm text-backstage/70">{o.note}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}