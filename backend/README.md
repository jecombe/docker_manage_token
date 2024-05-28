# Class Descriptions

## Folder `contract`
This folder includes the connections to the blockchain and smart contract.

### Class `Contract`
This class contains the connections to the smart contract and handles parsing useful information for the logs. It extends the `Viem` class.

### Class `Viem`
This class manages the Viem functions, including HTTP and WebSocket log functions.

## Folder `core`
This folder includes the main classes of the project.

### Class `Analyze`
Creates all the classes needed for the project using the configuration file. It initializes and starts the project.

### Class `Core`
This class contains all the project logic, including data analysis loops.

### Class `Sender`
This class contains all the data sending functions. It handles transmitting the correct data to the correct protocol (WebSocket, HTTP) and also records the information in the database.

## Folder `dataBase`
This folder contains the `DataBase` class and the entity classes for PostgreSQL queries.

### Class `DataBase`
This class contains functions for database management, allowing the addition, deletion, or updating of data.

### File `Entity`
This file contains two classes: `ContractLog` and `ContractVolume`. These classes are used in the `DataBase` class to have an ORM representation for executing PostgreSQL queries.

## Folder `server`
This folder contains all the classes useful for the server (HTTP API, socket.io).

### Class `Api`
This class handles the creation of the application's API. It takes the server, database, and core application as parameters. It creates calls on these objects when an API event is detected.

### Class `Server`
This class manages the server, including all CORS parameters.

### Class `Socket`
This class manages the sockets with the users. It sends data via WebSocket to the correct user. The class takes the `Users` class as a parameter to add or remove a socket based on the user's connection status, and the `Server` class to connect the socket with the server.

## Folder `users`
This folder contains the `Users` class.

### Class `Users`
This class manages the addresses with the socket IDs of the application users.
