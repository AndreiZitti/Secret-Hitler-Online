import React, { Component } from "react";
import "../selectable.css";
import "./IconSelection.css";
import portraits, {
  unlockedPortraits,
  lockedPortraits,
  defaultPortrait,
} from "../assets";
import { portraitsAltText } from "../assets";

import ButtonPrompt from "./ButtonPrompt";
import CameraCapture from "./CameraCapture";
import { SendWSCommand, WSCommandType } from "../types";

type IconSelectionProps = {
  playerToIcon: Record<string, string>;
  players: string[];
  sendWSCommand: SendWSCommand;
  user: string;
  onConfirm: () => void;
  onClickTweet: () => void; // Kept for compatibility, but unused
};

type IconSelectionState = {
  showCamera: boolean;
};

class IconSelection extends Component<IconSelectionProps, IconSelectionState> {
  constructor(props: IconSelectionProps) {
    super(props);

    this.state = {
      showCamera: false,
    };

    this.onConfirmButtonClick = this.onConfirmButtonClick.bind(this);
    this.getIconButtonHML = this.getIconButtonHML.bind(this);
    this.isIconInUse = this.isIconInUse.bind(this);
    this.onTakePhotoClick = this.onTakePhotoClick.bind(this);
    this.onCameraCapture = this.onCameraCapture.bind(this);
    this.onCameraCancel = this.onCameraCancel.bind(this);
  }

  isIconInUse(iconID: string) {
    let playerOrder = this.props.players;
    for (let i = 0; i < playerOrder.length; i++) {
      let player = playerOrder[i];
      if (this.props.playerToIcon[player] === iconID) {
        return true;
      }
    }
    return false;
  }

  onClickIcon(iconID: string) {
    // Verify that player is able to select this icon.
    // Does not allow selection if user has already selected this icon
    let unselectable = this.isIconInUse(iconID);

    if (!unselectable) {
      // This is a valid choice according to our current game state
      // Register the selection with the server.
      this.props.sendWSCommand({
        command: WSCommandType.SELECT_ICON,
        icon: iconID,
      });
    }
  }

  onTakePhotoClick() {
    this.setState({ showCamera: true });
  }

  onCameraCapture(imageDataUrl: string) {
    // Send the captured photo as the icon
    this.props.sendWSCommand({
      command: WSCommandType.SELECT_ICON,
      icon: imageDataUrl,
    });
    this.setState({ showCamera: false });
  }

  onCameraCancel() {
    this.setState({ showCamera: false });
  }

  /**
   * Called when any icon is clicked.
   * @effects Attempts to send the server a command with the player's vote, and locks access to the button
   *          for {@code SERVER_TIMEOUT} ms.
   */
  onConfirmButtonClick() {
    // Check that user has a profile picture assigned according to the game state
    if (this.props.playerToIcon[this.props.user] !== defaultPortrait) {
      this.props.onConfirm();
    }
  }

  getIconButtonHML(portraitNames: string[]): React.JSX.Element {
    // Update selections based on game state given by the server (this prevents duplicate player icons).

    let currPortrait = this.props.playerToIcon[this.props.user];

    const iconHTML: (React.JSX.Element | undefined)[] = portraitNames.map(
      (portraitID, index: number) => {
        // Check if valid portrait name
        if (!portraits[portraitID]) {
          return undefined;
        }
        // Disable icons currently selected by other players.
        let isIconAvailable =
          !this.isIconInUse(portraitID) || portraitID === currPortrait;
        let isEnabled = isIconAvailable;
        let isSelected = currPortrait === portraitID;
        return (
          <img
            id={"icon"}
            key={index}
            className={
              "selectable" +
              (isSelected ? " selected" : "") +
              (!isEnabled ? " disabled" : "")
            }
            alt={portraitsAltText[portraitID]}
            src={portraits[portraitID]}
            draggable={false}
            onClick={() => this.onClickIcon(portraitID)}
          ></img>
        );
      }
    );

    // Return all the icons in a div container.
    return <div id={"icon-container"}>{iconHTML}</div>;
  }

  render() {
    // Show all portraits (unlocked + locked) since Twitter unlock is removed
    const allPortraits = unlockedPortraits.concat(lockedPortraits);
    const currPortrait = this.props.playerToIcon[this.props.user];
    const hasCustomPhoto = currPortrait && currPortrait.startsWith("data:image");

    return (
      <>
        {this.state.showCamera && (
          <CameraCapture
            onCapture={this.onCameraCapture}
            onCancel={this.onCameraCancel}
          />
        )}
        <ButtonPrompt
          label={"PLAYER LOOK"}
          renderHeader={() => {
            return (
              <>
                <p>Choose a look or take a photo, then press confirm.</p>
                <div id="take-photo-container">
                  <button
                    id="take-photo-btn"
                    onClick={this.onTakePhotoClick}
                    className={hasCustomPhoto ? "selected" : ""}
                  >
                    Take Photo
                  </button>
                  {hasCustomPhoto && (
                    <img
                      src={currPortrait}
                      alt="Your photo"
                      className="custom-photo-preview"
                    />
                  )}
                </div>
                {this.getIconButtonHML(allPortraits)}
              </>
            );
          }}
          buttonDisabled={
            this.props.playerToIcon[this.props.user] === defaultPortrait
          }
          buttonOnClick={this.onConfirmButtonClick}
        ></ButtonPrompt>
      </>
    );
  }
}

export default IconSelection;
