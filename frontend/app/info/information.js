"use client";
import React, { useState, useEffect, useRef } from "react";
import "./information.css";
import { CircleLoader } from "react-spinners";
import { deleteBdd, fetchAllLogs, fetchAllLogsFromAddr, fetchAllowancesFromAddr, fetchTranferFromAddr, fetchVolumesDaily } from "@/utils/server";
import VolumeChart from "../chart/chart";

export default function Information({ userAddress, isConnect, socket }) {
  const [loadingAll, setLoadingAll] = useState(true)
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingAllowance, setLoadingAllowance] = useState(true)
  const [loadingChart, setLoadingChart] = useState(true)

  const [allowances, setAllowances] = useState([]);
  const [volumes, setVolumes] = useState([]);
  const [userLogs, setUserLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [intervalId, setIntervalId] = useState(null);


  const [stop, setStop] = useState(false);


  const [isStopped, setIsStopped] = useState(true);

  const stopRef = useRef(stop);

  /*const processLogsBatch = async () => {
    const batchStartTime = Date.now();
    const { logSave, i, blockNumber } = await getEventLogs(
      objectData.save,
      objectData.iSave,
      objectData.blockNumberStart
    );
    objectData.iSave = i;
    objectData.save = logSave;
    objectData.blockNumberStart = blockNumber;

    setAllLogs(objectData.save);
    const user = parseUserLogs(objectData.save, userAddress);
    setUserLogs(user);
    setAllowances(parseAllowance(user, userAddress));
    await waitingRate(batchStartTime, objectData.timePerRequest);
  };*/

  const dispatchUser = (logsUser) => {

    if (logsUser.eventname === "Approval") {
      setAllowances(prevLogs => [...prevLogs, logsUser]);

    }
    setUserLogs(prevLogs => [...prevLogs, logsUser]);
  }

  const dispatchUsers = (logsUsers) => {
    setAllLogs(prevLogs => [...prevLogs, logsUsers]);
  }

  const dispatchVolume = (logsVolume) => {
    setVolumes(prevLogs => [...prevLogs, logsVolume]);
  }


  const setLoading = (isLoading) => {
    setLoadingAll(isLoading);
    setLoadingUser(isLoading);
    setLoadingAllowance(isLoading);
    setLoadingChart(isLoading)
  }
  useEffect(() => {
    if (socket) {
      socket.on("allData", (data) => {
        console.log("Received allData:", data);
        dispatchUsers(data)
      });

      socket.on("myData", (data) => {
        console.log("Received myData:", data);
        dispatchUser(data)
      });

      socket.on("volume", (data) => {
        console.log("Received Volume:", data);
        dispatchVolume(data)
      });

    }

    return () => {
      if (socket) {
        socket.off("allData");
      }
    };
  }, [socket]);


  const getDataFromDb = async () => {

    const requests = [
      { id: "allLogs", promise: fetchAllLogs() },
      { id: "allLogsFromAddr", promise: fetchAllLogsFromAddr(userAddress) },
      { id: "allowancesFromAddr", promise: fetchAllowancesFromAddr(userAddress) },
      { id: "tranferFromAddr", promise: fetchTranferFromAddr(userAddress) },
      { id: "volumesDaily", promise: fetchVolumesDaily(userAddress) }

    ];

    return Promise.all(requests.map(req => req.promise))
      .then(responses => {
        const results = {};
        responses.forEach((response, index) => {
          results[requests[index].id] = response;
        });
        return results
      }).catch(e => {
        console.log(e)
      })

  }

  const parsingDataApi = (result) => {
    const { allLogs, allLogsFromAddr, allowancesFromAddr, volumesDaily } = result;
    setAllLogs(allLogs)
    setUserLogs(allLogsFromAddr);
    setAllowances(allowancesFromAddr)

    console.log(volumesDaily);


    setVolumes(volumesDaily.map(item => {
      const dateWithoutTime = new Date(item.timestamp).toISOString().split('T')[0];
      return { ...item, timestamp: dateWithoutTime };
    }))

  }

  const getInfoDatabase = async () => {
    // const intervalId = setInterval(async () => {
    try {
      console.log("interval fetching");
      const repUserTx = await getDataFromDb()
      console.log("GET INFO DATABASE", repUserTx);
      parsingDataApi(repUserTx);
    } catch (error) {
      console.error(error);
    }
    // }, 60000);
    //
    // setIntervalId(intervalId);
  }


  const getLogsContract = async () => {
    try {
      console.log("waiting data...");
      const repUserTx = await getDataFromDb()
      console.log(repUserTx);
      parsingDataApi(repUserTx);
      getInfoDatabase()

    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  useEffect(() => {
    if (isConnect && !stop) {
      getLogsContract();
    }
  }, [stop]);

  const stopRequest = () => {
    console.log("STOP");
    setStop(true);
    setIsStopped(false);
    setLoading(false);
    clearInterval(intervalId)
    setIntervalId(0)
  };
  const startRequest = () => {
    setStop(false);
    setIsStopped(true);
    setLoading(true);
    getInfoDatabase();
    console.log("start");
  };

  const resetData = async () => {
    try {
      const rep = await deleteBdd();
      console.log("DELETE -> ", rep);
      setAllLogs([]);
      setAllowances([]);
      setUserLogs([]);
      setVolumes([])

    } catch (error) {
      console.log(error);
    }
  }

  const resetRequest = () => {
    setStop(true);
    setIsStopped(false);
    setLoading(false);
    resetData();
    setTimeout(() => {
      setStop(false);
      setIsStopped(true);
      setLoading(true);

    }, 2000);
  };

  return (
    <div className="container">
      <div>
        {isStopped ? (
          <button className="stopButton" onClick={stopRequest}>
            Stop Fetching
          </button>
        ) : (
          <button className="startButton" onClick={startRequest}>
            Start Fetching
          </button>
        )}
        <button className="startButton" onClick={resetRequest}>
          Reset
        </button>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2 style={{ marginRight: "10px" }}>Logs BUSD users</h2>
          {loadingAll && (
            <CircleLoader color={"#000000"} loading={loadingAll} size={20} />
          )}
        </div>
        <div className="top-table">
          {allLogs.length > 0 && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Block</th>
                    <th>Event</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {allLogs.map((action, index) => (
                    <tr
                      key={index}
                      style={{ overflowY: index >= 1 ? "auto" : "visible" }}
                    >
                      <td>{action.blocknumber}</td>
                      <td>{action.eventname}</td>
                      <td>{action?.fromaddress}</td>
                      <td>{action?.toaddress}</td>
                      <td>{action.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="bottom-tables">
        <div className="side-by-side">
          <div style={{ marginRight: '20px' }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h2 style={{ marginRight: "10px" }}>Your BUSD logs</h2>
              {loadingUser && (
                <CircleLoader color={"#000000"} loading={loadingUser} size={20} />
              )}
            </div>

            {userLogs.length > 0 && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Event</th>
                      <th>To</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.map((action, index) => (
                      <tr
                        key={index}
                        style={{ overflowY: index >= 1 ? "auto" : "visible" }}
                      >
                        <td>{action.blocknumber}</td>
                        <td>{action.eventname}</td>
                        <td>{action?.toaddress}</td>
                        <td>{action.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ marginLeft: '20px' }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <h2 style={{ marginRight: "10px" }}>Your BUSD Allowances</h2>
              {loadingAllowance && (
                <CircleLoader color={"#000000"} loading={loadingAllowance} size={20} />
              )}
            </div>
            {allowances.length > 0 && (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Block</th>
                      <th>Sender</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allowances.map((action, index) => (
                      <tr
                        key={index}
                        style={{ overflowY: index >= 1 ? "auto" : "visible" }}
                      >
                        <td>{action.blocknumber}</td>
                        <td>{action?.fromaddress}</td>
                        <td>{action.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <hr style={{ width: "100%", borderTop: "3px solid black" }} />

      <div className="chart-container">
        <div style={{ marginLeft: '20px' }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ marginRight: "10px" }}>Daily Volumes BUSD</h2>
            {loadingChart && (
              <CircleLoader color={"#000000"} loading={loadingUser} size={20} />
            )}
            {!_.isEmpty(volumes) ? <VolumeChart data={volumes} /> : null}

          </div>
        </div>
      </div>
    </div>
  );
}
