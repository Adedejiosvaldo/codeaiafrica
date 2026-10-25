import { LinkButton } from "../../components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md place-items-center gap-4 px-4 py-28 text-center">
      <p className="font-display text-7xl font-extrabold text-brand-700">404</p>
      <h1 className="text-2xl font-bold">We can't find that page</h1>
      <p className="text-ink-soft">The link may be old or mistyped.</p>
      <LinkButton to="/">Go to the home page</LinkButton>
    </div>
  );
}
