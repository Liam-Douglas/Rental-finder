interface Props {
  source: string;
  sourceUrls?: Record<string, string>;
}

const SOURCE_LABEL: Record<string, string> = {
  domain: "Domain",
  rea: "REA",
  allhomes: "Allhomes",
};

const SOURCE_COLOR: Record<string, string> = {
  domain: "bg-blue-600 text-white",
  rea: "bg-green-600 text-white",
  allhomes: "bg-orange-600 text-white",
};

export default function SourceBadge({ source, sourceUrls = {} }: Props) {
  const extras = Object.entries(sourceUrls).filter(([k]) => k !== source);
  return (
    <div className="flex gap-1 flex-wrap">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLOR[source] ?? "bg-slate-600 text-white"}`}>
        {SOURCE_LABEL[source] ?? source}
      </span>
      {extras.map(([src, url]) => (
        <a
          key={src}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_COLOR[src] ?? "bg-slate-600 text-white"} opacity-80 hover:opacity-100`}
        >
          Also on {SOURCE_LABEL[src] ?? src}
        </a>
      ))}
    </div>
  );
}
