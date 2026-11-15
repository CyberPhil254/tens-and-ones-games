import { Num } from './ui/Num';

/** Placeholder screen. The games arrive one pull request at a time. */
export function App() {
  return (
    <main>
      <h1>Tens and Ones</h1>
      <div className="card">
        <p>
          The new app is being built here. The games are still at their usual place until this one is ready.
        </p>
        <p>
          <Num n={34} /> is 3 tens and 4 ones.
        </p>
      </div>
    </main>
  );
}
