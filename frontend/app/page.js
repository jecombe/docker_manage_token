import Wallet from "./wallet/wallet";
import "./page.css";

export default function Home() {
  return (
    <main>
      <div className="description">
        <h1 className="title">Manage Token BUSD</h1>
        <Wallet />
      </div>
    </main>
  );
}
