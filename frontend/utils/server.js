import axios from 'axios';

const url = 'https://jeremy.training.real-estate-executive.com';

export const fetchAllLogs = async () => {
    try {
        const response = await req("/api/get-all");
        return response.data;

    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération des données:', error);
    }
};


const req = async (funcApi, params = {}) => {
    return axios.get(`${url}${funcApi}`, { params })

}

export const deleteBdd = async () => {
    return axios.delete(`${url}/api/delete-database`)
}


export const fetchAllLogsFromAddr = async (userAddress) => {
    try {
        const params = {
            userAddress
        }
        // const response = await axios.get('http://localhost:8000/api/get-all-transac-addr', params);
        const response = await req("/api/get-all-addr", params)
        return response.data;
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération des données:', error);
    }
};


export const fetchTranferFromAddr = async (userAddress) => {
    try {
        const params = {
            userAddress
        }
        const response = await req("/api/get-all-transac-addr", params)
        return response.data;

    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération des données:', error);
    }
};


export const fetchVolumesDaily = async () => {
    try {
        const response = await req("/api/get-all-volumes")
        return response.data;

    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération des données:', error);
    }
};

export const fetchAllowancesFromAddr = async (userAddress) => {
    try {
        const params = {
            userAddress
        }

        const response = await req('/api/get-all-allowances-addr',
            params
        )
        return response.data;
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération des données:', error);
    }
};

