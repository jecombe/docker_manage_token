import { useState, useEffect } from 'react';
import "./swap.css";
import { getContractInfos, getReadFunctions, getWriteFunctions, waitingTransaction, waitingTransactions } from '@/utils/request';
import routerAbi from '@/utils/abi/router';
import pairAbi from '@/utils/abi/pair';
import { formatUnits, parseEther, parseUnits } from 'viem';
import abi from '@/utils/abi';
import { CircleLoader } from "react-spinners";

const Swap = ({ balanceBusd, balanceWbtc, addressUser }) => {
  const [amountA, setAmountA] = useState(BigInt(0));
  const [amountB, setAmountB] = useState(BigInt(0));
  const [amountABig, setAmountABig] = useState(BigInt(0));
  const [amountBBig, setAmountBBig] = useState(BigInt(0));
  const [slippage, setSlippage] = useState(0);
  const [pair, setPair] = useState(getContractInfos("0x277B37e50272f74f7Bc00a857C99dAe937378E3f", pairAbi))
  const [reserve, setReserve] = useState([]);
  const [afterSplippage, setAfterSplippage] = useState(0);
  const [amtSplippage, setAmtSplippage] = useState(BigInt(0));

  const [isSwapDisabled, setIsSwapDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [isArrowUp, setIsArrowUp] = useState(false);
  const [actualToken, setActualToken] = useState(null)

  const handleInvert = () => {
    setIsArrowUp(!isArrowUp);
    setAmountA(amountB);
    setAmountB(amountA);
    setAfterSplippage(amountA)
    setSlippage(slippage)


    document.getElementById('BUSD').id = 'WBTC';
    document.getElementById('WBTC').id = 'BUSD';
  };

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

  useEffect(() => {
    const isSufficientBalance = isArrowUp ? formatUnits(balanceWbtc, 8) >= amountB : formatUnits(balanceBusd, 18) >= amountABig
    setIsSwapDisabled(isSufficientBalance);
  }, [balanceBusd, balanceWbtc, amountA, amountB, isArrowUp, isSwapDisabled]);

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


  /*const getAmtAfterSlippage = (slippage, amount) => {
    const amountReceiveBigInt = BigInt(amount);
    const slippageAmount = amountReceiveBigInt * BigInt(slippage) / BigInt(100);
    return amountReceiveBigInt - slippageAmount;
  }*/



  const getAmtAfterSlippage = (amount) => {
    const slippageAmount = amount * BigInt(slippage) / BigInt(100);
    return amount - slippageAmount;
  }

  /*const calculeAmount = async (intValue, isOut, reserve1, reserve2) => {
    try {
      let amountReceive = BigInt(0);
      console.log(intValue, isOut, reserve1, reserve2);
      const amountSplippage = getAmtAfterSlippage(intValue)
      if (isOut) {
        amountReceive = getAmountOut(amountSplippage, reserve1, reserve2)
      } else {
        amountReceive = getAmountIn(amountSplippage, reserve1, reserve2);

      }
      return { amountReceive, amountSplippage };
    } catch (error) {
      console.error(error);
    }
  }*/

  const manageIn = (value, isSlippage, intValue, reserve1, reserve2, decimal1, decimal2) => {
    if (!isSlippage) {
      setAmountB(value)
      setAmountBBig(intValue)
    }
    const amt = getAmtAfterSlippage(intValue)

    const amountReceive = getAmountIn(amt, reserve1, reserve2);
    if (!isSlippage) {

      setAmountA(formatUnits(amountReceive, decimal1));
      setAmountABig(BigInt(amountReceive))
    }
    setAfterSplippage(formatUnits(amt, decimal2))
    setAmtSplippage(amt)
  }

  const manageOut = (value, isSlippage, intValue, reserve1, reserve2, decimal1, decimal2) => {
    if (!isSlippage) {
      setAmountA(value)
      setAmountABig(intValue)
    }
    const amountReceive = getAmountOut(intValue, reserve1, reserve2)
    const bigReceive = BigInt(amountReceive)


    if (!isSlippage) {
      setAmountB(formatUnits(amountReceive, decimal1));
      setAmountBBig(bigReceive)
    }
    const amt = getAmtAfterSlippage(bigReceive)

    setAfterSplippage(formatUnits(amt, decimal2))
    setAmtSplippage(amt)
  }


  const calculeAmountOut = async (value, id, isSlippage) => {
    if (id === 'BUSD') {
      const intValue = parseUnits(value.toString(), 18);
      if (isArrowUp) {
        manageIn(value, isSlippage, intValue, reserve[1], reserve[0], 8, 18);
        /*  if (!isSlippage) {
            setAmountB(value)
            setAmountBBig(intValue)
          }*/
        /*const amt = getAmtAfterSlippage(intValue)

        amountReceive = getAmountIn(amt, reserve[1], reserve[0]);
        if (!isSlippage) {

          setAmountA(formatUnits(amountReceive, 8));
          setAmountABig(BigInt(amountReceive))
        }
        setAfterSplippage(formatUnits(amt, 18))
        setAmtSplippage(amt)*/
      }
      else {
        manageOut(value, isSlippage, intValue, reserve[0], reserve[1], 8, 8);
/*
        if (!isSlippage) {
          setAmountA(value)
          setAmountABig(intValue)
        }
        amountReceive = getAmountOut(intValue, reserve[0], reserve[1])

        if (!isSlippage) {
          setAmountB(formatUnits(amountReceive, 8));
          setAmountBBig(BigInt(amountReceive))
        }
        const amt = getAmtAfterSlippage(BigInt(amountReceive))

        setAfterSplippage(formatUnits(amt, 8))
        setAmtSplippage(amt)*/
      }
    }
    if (id === 'WBTC') {
      const intValue = parseUnits(value.toString(), 8);
      manageOut

      if (isArrowUp) {
         manageOut(value, isSlippage, intValue, reserve[1], reserve[0], 18, 18);

        /*if (!isSlippage) {
          setAmountA(value)
          setAmountABig(intValue)
        }
        amountReceive = getAmountOut(intValue, reserve[1], reserve[0])

        if (!isSlippage) {
          setAmountB(formatUnits(amountReceive, 18));
          setAmountBBig(BigInt(amountReceive))
        }
        const amt = getAmtAfterSlippage(amountBBig)

        setAfterSplippage(formatUnits(amt, 18))
        setAmtSplippage(amt)*/

      }
      else {
        manageIn(value, isSlippage, intValue, reserve[0], reserve[1], 18, 8);

        /*if (!isSlippage) {

          setAmountB(value)
          setAmountBBig(intValue)
        }

        const amt = getAmtAfterSlippage(intValue)
        const res = getAmountIn(amt, reserve[0], reserve[1])
        if (!isSlippage) {

          setAmountA(formatUnits(res, 18));
          setAmountABig(BigInt(res))
        }
        setAfterSplippage(formatUnits(amt, 8))
        setAmtSplippage(amt)*/

      }

    }

  }

  const handleAmountChange = async (e) => {
    const { id, value } = e.target;
    calculeAmountOut(value, id, false)
  };

  const approveFunction = async (spenderAddress, contractAddress, amount) => {
    try {
      const hashApprove = await getWriteFunctions("approve", [spenderAddress, amount], addressUser, contractAddress, abi)
      await waitingTransactions(hashApprove, pair.publicClient);
      return hashApprove;
    } catch (error) {
      console.error(error)
    }
  }

  const sendSwap = async (amount1, amount2, path, func) => {
    try {
      const deadline = Math.floor(Date.now() / 1000) + 60 * 3;

      const hash = await getWriteFunctions(func, [amount1, amount2, path, addressUser, deadline], addressUser, "0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", routerAbi);
      await waitingTransaction(hash);
      console.log(hash);
    } catch (error) {
      console.error(error);
    }
  }

  const handleSwap = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const pathWbtcUsd = [process.env.WBTC, process.env.CONTRACT];
    const pathUsdWbtc = [process.env.CONTRACT, process.env.WBTC];

    try {
      if (isArrowUp) {
        if (actualToken === "WBTC") {
          console.log("swapTokensForExactTokens");
          await sendSwap(amountBBig, amountABig, pathWbtcUsd, "swapTokensForExactTokens")
        } else {
          console.log("swapExactTokensForTokens");
          await sendSwap(amountABig, amtSplippage, pathWbtcUsd, "swapExactTokensForTokens")
        }
      } else {
        if (actualToken === "WBTC") {
          console.log("swapTokensForExactTokens");
          await sendSwap(amountBBig, amountABig, pathUsdWbtc, "swapTokensForExactTokens")

        } else {
          console.log("swapExactTokensForTokens");
          await sendSwap(amountABig, amtSplippage, pathUsdWbtc, "swapExactTokensForTokens")
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false)
    }
  };



  const handleSlippageChange = (e) => {
    //setSlippage(e.target.value);

    const newSlippage = parseInt(e.target.value, 10);
    setSlippage(newSlippage);

    calculeAmountOut(amountA, 'BUSD', true);
    calculeAmountOut(amountB, 'WBTC', true);
  };

  const handleMaxClick = (token) => {

    if (token === "BUSD") {
      calculeAmountOut(formatUnits(balanceBusd.toString(), 18), token, false);
    }
    if (token === "WBTC") {
      calculeAmountOut(formatUnits(balanceWbtc.toString(), 8), token, false);
    }
  }

  useEffect(() => {
    console.log(amountA, amountB, reserve);
    // Appeler calculeAmountOut lorsque la valeur de slippage change
    if (!_.isEmpty(reserve)) {
      calculeAmountOut(amountA, 'BUSD', true);
      calculeAmountOut(amountB, 'WBTC', true);
    }
  }, [slippage]);



  const printBalance = (balance, decimal) => {
    return parseFloat(formatUnits(balance.toString(), decimal)).toFixed(3)
  }

  const handleApprove = async () => {
    try {
      setIsLoading(true)

      if (isArrowUp) {
        const hashApprove = await approveFunction("0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", "0xFa1e53C68c045589cb5BaC4B311337c9f42e2241", amountABig);
        console.log("APPROVE : ", hashApprove);
        setIsLoading(false)
      } else {
        const hashApprove = await approveFunction("0x13603a16785B335dC63Edb4d4b1EA5A24E10ECc9", "0x6A7577c10cD3F595eB2dbB71331D7Bf7223E1Aac", amountABig);
        console.log("APPROVE : ", hashApprove);
        setIsLoading(false)
      }

    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h3>Swap Tokens</h3>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label htmlFor="BUSD">{isArrowUp ? 'WBTC' : 'BUSD'}</label>
          <div className="input-container">
            <input
              type="text"
              id="BUSD"
              onClick={() => setActualToken('BUSD')}
              value={amountA.toString()}
              onChange={handleAmountChange}
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
            />
            <div className="balance-container">
              <div>Balance: {isArrowUp ? printBalance(balanceWbtc, 8) : printBalance(balanceBusd, 18)}</div>
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
            onClick={() => setActualToken('WBTC')}
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
        <div className="form-group" style={{ display: 'flex', justifyContent: 'center' }}>
          {isLoading ? (
            <CircleLoader color={"#36D7B7"} loading={isLoading} />
          ) : (
            <>
              <button type="button" disabled={isSwapDisabled} onClick={handleApprove} style={{
                opacity: isSwapDisabled ? '0.5' : '1',
                cursor: isSwapDisabled ? 'not-allowed' : 'pointer',
                marginRight: '10px' // Ajout de la marge à droite pour espacement
              }}>
                Approve
              </button>
              <button type="submit" disabled={isSwapDisabled} onClick={handleSwap} style={{
                opacity: isSwapDisabled ? '0.5' : '1',
                cursor: isSwapDisabled ? 'not-allowed' : 'pointer'
              }}>
                Swap Tokens
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );

};

export default Swap;
