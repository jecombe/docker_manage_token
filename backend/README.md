## Class Descriptions

### Class Core

This class is the main class, where all the logic for processing logs resides. It traverses the logs, processes them, and checks if any logs already exist. If they don't, it records them and sends them to the clients.

### Class Users

This class manages the users of the application, linking an ETH address to a socket. It allows adding and removing users.

### Class Contract

This class enables connection to the blockchain using the Viem class. It provides access to log functions, both via HTTP and WebSocket. It parses the log results to extract relevant information for the application.

### Class Viem

This class contains the Viem functions.

### Class DataBase

This class contains functions for database management, allowing the addition, deletion, or updating of data.

### Class Api

This class handles the creation of the application's API. It takes the server, database, and core application as parameters. It creates calls on these objects when an API event is detected.

### Class Server

This class manages the server, including all CORS parameters.

### Class Socket

This class manages the sockets with the users. It sends data via WebSocket to the correct user. The class takes the Users class as a parameter to add or remove a socket based on the user's connection status, and the Server class to connect the socket with the server.
