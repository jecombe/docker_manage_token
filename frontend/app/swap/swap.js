import { useState, useEffect } from 'react';
import "./swap.css";
import { getContractInfos, getReadFunctions, getWriteFunctions } from '@/utils/request';
import routerAbi from '@/utils/abi/router';
import factoryAbi from '@/utils/abi/factory';
import pairAbi from '@/utils/abi/pair';
import { formatEther, formatUnits, parseUnits } from 'viem';

const Swap = ({ balanceBusd, balanceWbtc, addressUser }) => {
  const [amountA, setAmountA] = useState(BigInt(0));
  const [amountB, setAmountB] = useState(BigInt(0));
  const [amountABig, setAmountABig] = useState(BigInt(0));
  const [amountBBig, setAmountBBig] = useState(BigInt(0));
  const [slippage, setSlippage] = useState(0);
  const [pair, setPair] = useState(getContractInfos("0x277B37e50272f74f7Bc00a857C99dAe937378E3f", pairAbi))
  const [reserve, setReserve] = useState([]);
  const [afterSplippage, setAfterSplippage] = useState(0);
  const [isSwapDisabled, setIsSwapDisabled] = useState(true); // État pour désactiver le bouton Swap

  const [isArrowUp, setIsArrowUp] = useState(false); // État pour suivre l'état de la flèche

  const handleInvert = () => {
    setIsArrowUp(!isArrowUp); // Inverser l'état de la flèche
    // Inverser les montants des champs WBTC et BUSD
    setAmountA(amountB);
    setAmountB(amountA);

    // Inverser les ID des champs d'entrée
    document.getElementById('BUSD').id = 'WBTC'; // changez l'ID de BUSD en WBTC
    document.getElementById('WBTC').id = 'BUSD'; // changez l'ID de WBTC en BUSD
  };
  const [priceSlippage, setPriceSlippage] = useState(BigInt(0));


  useEffect(() => {
    // Fonction pour récupérer les réserves de la paire de liquidités
    const getReserves = async () => {
      try {
        const res = await getReadFunctions("getReserves", [], "0x277B37e50272f74f7Bc00a857C99dAe937378E3f", pairAbi);
        setReserve(res)
      } catch (error) {
        console.error("Error getting reserves:", error);
      }
    };

    getReserves();
  }, [pair]);
  useEffect(() => {
    // Mettre à jour les ID des champs d'entrée lorsque isArrowUp change
    const invertInputIds = () => {
      const busdInput = document.getElementById('BUSD');
      const wbtcInput = document.getElementById('WBTC');
      if (isArrowUp) {
        busdInput.id = 'WBTC';
        wbtcInput.id = 'BUSD';
      } else {
        busdInput.id = 'BUSD';
        wbtcInput.id = 'WBTC';
      }
    };

    invertInputIds(); // Appeler la fonction lors du premier rendu

    // Nettoyer l'effet
    return () => {
      // Vous pouvez nettoyer ici si nécessaire
    };
  }, [isArrowUp]);


  const getAmountOut = (amountIn, reserveIn, reserveOut) => {
    const amountInWithFee = amountIn * BigInt(997)
    const numerator = amountInWithFee * BigInt(reserveOut);
    const denominator = (reserveIn * BigInt(1000)) + amountInWithFee;
    const amountOut = numerator / denominator;
    return amountOut.toString();
  }

  const getAmountIn = (amountIn, reserveIn, reserveOut) => {
    const numerator = reserveIn * amountIn * 1000n;
    const denominator = (reserveOut - amountIn) * 997n;
    const amountOut = numerator / denominator + 1n;
    return amountOut.toString();
  }


  const getAmountOutContract = async (amountIn) => {
    return getReadFunctions("getAmountOut", [amountIn, reserve[0], reserve[1]], "0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", routerAbi);
  }

  const getAmountInContract = async (amountIn, reserveIn, reserveOut) => {
    return getReadFunctions("getAmountIn", [amountIn, reserveIn, reserveOut], "0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", routerAbi);
  }

  const getAmtAfterSlippage = (slippage, amount) => {
    const amountReceiveBigInt = BigInt(amount);
    const slippageAmount = amountReceiveBigInt * BigInt(slippage) / BigInt(100);
    return amountReceiveBigInt - slippageAmount;
  }


  const calculeAmountOut = async (value, id) => {

    if (id === 'BUSD') {
      let amountReceive = 0;
      const intValue = parseUnits(value.toString(), 18);

      if (isArrowUp) {
        setAmountB(value)
        setAmountBBig(intValue)
        const slippageAmount = intValue * BigInt(slippage) / BigInt(100);
        const amt = intValue - slippageAmount;
        amountReceive = getAmountIn(amt, reserve[1], reserve[0]);
        console.log(amountReceive);
        console.log(formatUnits(amountReceive, 8));

        setAmountA(formatUnits(amountReceive, 8));
        setAmountABig(BigInt(amountReceive))
 
        setAfterSplippage(formatUnits(amt, 18))
      }
      else {
        setAmountA(value)
        setAmountABig(intValue)

        amountReceive = getAmountOut(intValue, reserve[0], reserve[1])
        setAmountB(formatUnits(amountReceive, 8));
        setAmountBBig(BigInt(amountReceive))
        const amountReceiveBigInt = BigInt(amountReceive);
        const slippageAmount = amountReceiveBigInt * BigInt(slippage) / BigInt(100);
        const amt = amountReceiveBigInt - slippageAmount;

        setAfterSplippage(formatUnits(amt, 8))
      }


    } else if (id === 'WBTC') {
      const intValue = parseUnits(value.toString(), 8);

      let amountReceive = 0;

      if (isArrowUp) {
        setAmountA(value)
        setAmountABig(intValue)

        amountReceive = getAmountIn(intValue, reserve[0], reserve[1]);
        setAmountB(formatUnits(amountReceive, 18));
        setAmountBBig(BigInt(amountReceive))

        const amountReceiveBigInt = BigInt(amountReceive);
        const slippageAmount = amountReceiveBigInt * BigInt(slippage) / BigInt(100);
        const amt = amountReceiveBigInt - slippageAmount;
        setAfterSplippage(formatUnits(amt, 18))
      }
      else {
        setAmountB(value)
        setAmountBBig(intValue)

        const slippageAmount = intValue * BigInt(slippage) / BigInt(100);
        const amt = intValue - slippageAmount;

        const res = getAmountIn(amt, reserve[0], reserve[1])
        console.log(formatUnits(res, 18));
        setAmountA(formatUnits(res, 18));
        setAmountABig(BigInt(res))

        setAfterSplippage(formatUnits(amt, 8))
      }
    }

  }

  const handleAmountChange = async (e) => {
    const { id, value } = e.target;

    calculeAmountOut(value, id)
  };

  const handleSwap = async (e) => {
    e.preventDefault();
    console.log("SWAP", isArrowUp);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 3; // 3 minutes à partir de maintenant

    if (isArrowUp) {

      console.log(amountABig, amountBBig);
      const path = [process.env.WBTC, process.env.CONTRACT]
      //  swapExactTokenForToken
      ///  export const getWriteFunctions = async (functionName, args, account, address, abi) => {
      const hash = await getWriteFunctions("swapTokensForExactTokens", [amountABig, amountBBig, path, addressUser, deadline], addressUser, "0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", routerAbi)

      await waitingTransaction(hash);


      //swapTokenForExactToken
    }
    else {
      console.log("EEEEEEEEEEEEEEEEEEEEEEE", amountABig, amountBBig);
      const path = [process.env.CONTRACT, process.env.WBTC]
      //  swapExactTokenForToken
      ///  export const getWriteFunctions = async (functionName, args, account, address, abi) => {

      console.log(routerAbi, addressUser);
      const hash = await getWriteFunctions("swapExactTokensForTokens", [amountABig, amountBBig, path, addressUser, deadline], addressUser, "0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", routerAbi)
      await waitingTransaction(hash);

    }
  };

  const handleSlippageChange = (e) => {
    console.log(isArrowUp);
    setSlippage(e.target.value);
  };


  const handleMaxClick = (token) => {

    if (token === "BUSD") {
      calculeAmountOut(formatUnits(balanceBusd.toString(), 18), token);
    }
    if (token === "WBTC") {
      calculeAmountOut(formatUnits(balanceWbtc.toString(), 8), token);
    }
  }


  useEffect(() => {
    console.log(Number(balanceBusd.toString()));
    setIsSwapDisabled(true)
    // setIsSwapDisabled(Number(balanceBusd.toString()) === 0 || Number(balanceWbtc.toString()) === 0);
  }, [balanceBusd, balanceWbtc]);



  return (
    <div className="form-container">
      <h3>Swap Tokens</h3>
      <form onSubmit={handleSwap}>
        <div className="form-group">
          <label htmlFor="BUSD">{isArrowUp ? 'WBTC' : 'BUSD'}</label>
          <div className="input-container">
            <input
              type="text"
              id="BUSD"
              value={amountA.toString()}
              onChange={handleAmountChange}
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <div className="balance-container">
              <div>Balance: {isArrowUp ? formatUnits(balanceWbtc.toString(), 8) : formatUnits(balanceBusd.toString(), 18)}</div>
              <div className="max" onClick={(e) => handleMaxClick(isArrowUp ? 'WBTC' : 'BUSD')}>Max</div>
            </div>
          </div>
        </div>

        <div className="invert-container">
          <div className={`invert-icon ${isArrowUp ? 'up' : ''}`} onClick={handleInvert}></div>
        </div>

        <div className="form-group">
          <label htmlFor="WBTC">{isArrowUp ? 'BUSD' : 'WBTC'}</label>
          <input
            type="text"
            id="WBTC"
            value={amountB.toString()}
            onChange={handleAmountChange}
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
          />
          <div>You receive: {afterSplippage}</div>
        </div>

        <div className="form-group">
          <label htmlFor="slippage">Slippage ({slippage}%)</label>
          <div className="slider-container">
            <span className="slider-label">0%</span>
            <input
              type="range"
              min="0"
              max="100"
              value={slippage}
              className="slider"
              id="slippage"
              onChange={handleSlippageChange}
            />
            <span className="slider-label">100%</span>
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={false}>Swap Tokens</button>
        </div>
      </form>
    </div>
  );
};

export default Swap;
