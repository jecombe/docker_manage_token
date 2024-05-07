import { useState, useEffect } from 'react';
import "./swap.css";
import { getContractInfos, getReadFunctions, getWriteFunctions, waitingTransaction } from '@/utils/request';
import routerAbi from '@/utils/abi/router';
import pairAbi from '@/utils/abi/pair';
import { formatUnits, parseUnits } from 'viem';
import abi from '@/utils/abi';

const Swap = ({ balanceBusd, balanceWbtc, addressUser }) => {
  const [amountA, setAmountA] = useState(BigInt(0));
  const [amountB, setAmountB] = useState(BigInt(0));
  const [amountABig, setAmountABig] = useState(BigInt(0));
  const [amountBBig, setAmountBBig] = useState(BigInt(0));
  const [slippage, setSlippage] = useState(0);
  const [pair, setPair] = useState(getContractInfos("0x277B37e50272f74f7Bc00a857C99dAe937378E3f", pairAbi))
  const [reserve, setReserve] = useState([]);
  const [afterSplippage, setAfterSplippage] = useState(0);
  const [isSwapDisabled, setIsSwapDisabled] = useState(true);

  const [isArrowUp, setIsArrowUp] = useState(false);

  const handleInvert = () => {
    setIsArrowUp(!isArrowUp);
    setAmountA(amountB);
    setAmountB(amountA);

    document.getElementById('BUSD').id = 'WBTC';
    document.getElementById('WBTC').id = 'BUSD';
  };
  const [priceSlippage, setPriceSlippage] = useState(BigInt(0));


  useEffect(() => {
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

    invertInputIds();

    return () => {
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

  const approveFunction = async (spenderAddress, contractAddress, amount) => {
    try {
      const hashApprove = await getWriteFunctions("approve", [spenderAddress, amount], addressUser, contractAddress, abi)
      await waitingTransaction(hashApprove);
      return hashApprove;
    } catch (error) {
      console.error(error)
    }
  }

  const handleSwap = async (e) => {
    e.preventDefault();
    const deadline = Math.floor(Date.now() / 1000) + 60 * 3;

    if (isArrowUp) {
      const path = [process.env.WBTC, process.env.CONTRACT]
      console.log("swapTokensForExactTokens");
      const hashApprove = await approveFunction("0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", "0xFa1e53C68c045589cb5BaC4B311337c9f42e2241", amountABig)
      console.log("APPROVED", hashApprove);

      const hash = await getWriteFunctions("swapTokensForExactTokens", [amountABig, amountBBig, path, addressUser, deadline], addressUser, "0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", routerAbi)
      console.log("transaction successfully: ", hash);
    }
    else {
      const path = [process.env.CONTRACT, process.env.WBTC]
      const hashApprove = await approveFunction("0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", "0x6A7577c10cD3F595eB2dbB71331D7Bf7223E1Aac", amountABig)
      console.log("APPROVED", hashApprove);

      const hash = await getWriteFunctions("swapExactTokensForTokens", [amountABig, amountBBig, path, addressUser, deadline], addressUser, "0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", routerAbi)
      await waitingTransaction(hash);
      console.log("transaction successfully: ", hash);
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
