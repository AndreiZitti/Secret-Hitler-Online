import React, {Component} from "react";
import "./LoginPageContent.css";

class LoginPageContent extends Component {

    render() {
        return (
            <div id={"#login-page-description-container"}>
                <div id={"login-page-description-text-container"}>
                    <p id={"login-page-description-text"}>
                        Adapted from the original <a href={"https://secrethitler.com"} target={"_blank"} rel="noreferrer">
                            Secret Hitler
                        </a> board game by Goat, Wolf, & Cabbage.
                    </p>
                </div>
            </div>
        );
    }

}

LoginPageContent.propTypes = {
};

export default LoginPageContent;
