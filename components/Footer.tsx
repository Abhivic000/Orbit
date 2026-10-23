export function Footer() {
  return (
    <footer className="relative z-10 border-t border-ink/10 px-5 py-10 text-sm text-ink-soft sm:px-8">
      <div className="mx-auto max-w-7xl space-y-2">
        <p>Orbit and Halo One are fictional — a portfolio project. Nothing here is for sale.</p>
        <p>
          3D model:{" "}
          <a
            className="underline underline-offset-4"
            href="https://sketchfab.com/3d-models/headphones-b12a7fb702804cc19537047a033fe0d9"
          >
            &ldquo;Headphones&rdquo;
          </a>{" "}
          by{" "}
          <a className="underline underline-offset-4" href="https://sketchfab.com/re1monsen">
            re1monsen
          </a>
          , licensed{" "}
          <a
            className="underline underline-offset-4"
            href="http://creativecommons.org/licenses/by/4.0/"
          >
            CC BY 4.0
          </a>
          ; modified (cable removed, re-materialed, compressed). Studio HDRI &ldquo;Studio Small
          09&rdquo; from{" "}
          <a
            className="underline underline-offset-4"
            href="https://polyhaven.com/a/studio_small_09"
          >
            Poly Haven
          </a>{" "}
          (CC0).
        </p>
      </div>
    </footer>
  );
}
