import { AuthBindings } from "@refinedev/core";
import { API_URL, dataProvider } from "./data";

// credentials for testing purposes
export const authCredentials = {
    email: "michael.scott@dundermifflin.com",
    password: "demodemo",
}

export const authProvider: AuthBindings = {
    login: async ({ email }) => {
        try{
        // call login mutation 
        // dataProvider.custom is used to make a custom request to the GraphQL API
        // this will call dataProvider which in turn will go through the fetchWrapper function
        const { data } = await dataProvider.custom({
            url: API_URL,
            method: "post",
            headers: {},
            meta: {
                variables: { email },
                // pass email to see if user exists
                rawQuery: `
                mutation Login($email: String!) {
                    login(loginInput: { email: $email }) {
                        accessToken
                    }
                }`,
            },
        })

        // save accessToken in loacalStorage
        localStorage.setItem("access_token", data?.login.accessToken)

        return {
            success: true,
            redirectTo: "/",
        } 
    } catch (e) {
        const error = e as Error

        return {
            success: false,
            error: {
                message: "message" in error ? error.message : "Login Failed",
                name: "name" in error ? error.name : "Invalid Email or password"
            }
        }
    }},

    // logOut functionality is basically removing the accessToken from localStorage
    logout: async () => {
        localStorage.removeItem("access_token")

        return {
            success: true,
            redirectTo: "/login"
        }
    },

    onError: async (error) => {
        // check if error is an auth error 
        // if so set logout to true 

        if (error.statusCode === "UNAUTHENTICATED") {
            return {
                logout: true,
                ...error
            }
        }
        return { error }
    },

    check: async () => {
        try{
            // get identity of useer 
            //to know whether user is authenticated or not 
            await dataProvider.custom({
                url: API_URL,
                method: "post",
                headers: {},
                meta: {
                    rawQuery: `
                    query Me {
                        me {
                            name
                        }
                    }`
                }
            })

            // if user redirect to home page
            return {
                authenticated: true,
                redirectTo: "/"
            }
        } catch (e) {
            // if any other error redirect to login
            return {
                authenticated: false,
                redirectTo: "/login"
            }
        }
    },

    // get user information 

    getIdentity: async () => {
        const accessToken = localStorage.getItem("access_token")
        try {
            // call graphQL API to get user information
            // we use me:any as the graphQL API does not have a set type for me query yet.
            // this will be later adjusted to use a User type
            const { data } = await dataProvider.custom<{ me:any }>({
                url: API_URL,
                method: "post",
                headers: accessToken ? {
                    Authorization: `Bearer ${accessToken}`
                } : {},
                meta: {
                    rawQuery: `
                    query Me {
                        me {
                            id
                            name
                            email
                            phone
                            jobTitle
                            timezone
                            avatarUrl
                        }
                    }`
                }
            })
            return data.me
        } catch (error) {
            return undefined
        }
    }
}