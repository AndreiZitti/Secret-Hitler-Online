import React, { Component } from "react";
import { SendWSCommand, WSCommandType } from "../types";
import ButtonPrompt from "./ButtonPrompt";

type DiscussionPromptProps = {
  isVIP: boolean;
  sendWSCommand: SendWSCommand;
  onConfirm: () => void;
};

class DiscussionPrompt extends Component<DiscussionPromptProps> {
  constructor(props: DiscussionPromptProps) {
    super(props);
    this.onClickEndDiscussion = this.onClickEndDiscussion.bind(this);
  }

  onClickEndDiscussion() {
    this.props.sendWSCommand({ command: WSCommandType.END_DISCUSSION });
    this.props.onConfirm();
  }

  render() {
    const { isVIP } = this.props;

    return (
      <ButtonPrompt
        label={"DISCUSSION"}
        renderHeader={() => {
          return (
            <>
              <p>
                Take this time to discuss the events of the last round with your
                fellow players.
              </p>
              <p style={{ fontStyle: "italic", marginTop: "1em" }}>
                Who do you trust? Who seems suspicious?
              </p>
            </>
          );
        }}
        renderFooter={() => {
          if (!isVIP) {
            return (
              <p style={{ marginTop: "1em", opacity: 0.7 }}>
                Waiting for the host to continue...
              </p>
            );
          }
          return null;
        }}
        buttonText={isVIP ? "END DISCUSSION" : "WAITING..."}
        buttonDisabled={!isVIP}
        buttonOnClick={this.onClickEndDiscussion}
      />
    );
  }
}

export default DiscussionPrompt;
