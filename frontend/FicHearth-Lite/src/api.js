import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.PROD ? "/" : "http://localhost:5004", 
    withCredentials: true,
});

const accessToken = localStorage.getItem("accessToken");
if (accessToken) {
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
}


let isRefreshing = false;
let refreshSubscribers = [];

api.interceptors.response.use(
    (response) => response, 
    async (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
	    if (!isRefreshing) {
                isRefreshing = true;
	        console.log("error");
                try {

                    
                    const refreshResponse = await axios.post(
                        "/auth/refresh-token",
                        {},
                        { withCredentials: true }
                    );

		    console.log("refreshing");

		    const newAccessToken = refreshResponse.data.accessToken;
		    api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
		    localStorage.setItem("accessToken", newAccessToken);
                
            	    
            	    error.config.headers["Authorization"] = `Bearer ${newAccessToken}`;
            	    return api.request(error.config);
            	} catch (refreshError) {
				if (!window.location.href.includes("/login")) { 
					console.error("Refresh token failed" + window.location.href + " ", refreshError);
					window.location.href = "/login"; 
					return Promise.reject(refreshError);
				}
            	}
            }
	}
        return Promise.reject(error);
    }
);

export default api;
