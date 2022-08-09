import {
  Button,
  ButtonGroup,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  useClipboard,
} from "@chakra-ui/react";
import { useState } from "react";

import { Firehose, Save } from "./firehose";

function SelectWithWarn(props: {
  firehose: Firehose;
  saveId: string;
  saves: Array<Save>;
}) {
  const { firehose, saveId, saves } = props;
  const [confirmSave, setConfirmSave] = useState("");
  const confirmName = saves.find((save) => save.id === confirmSave)?.name;
  return (
    <>
      <Select
        value={saveId}
        size="sm"
        onChange={(e) => {
          if (!saveId) {
            setConfirmSave(e.target.value);
          } else {
            firehose.loadSave(e.target.value);
          }
        }}
        width="fit-content"
        minWidth="10em"
        display="inline-block"
      >
        {!saveId && <option value="">Not saved</option>}
        {saves.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </Select>
      <Modal isOpen={Boolean(confirmSave)} onClose={() => setConfirmSave("")}>
        <ModalBody>
          The current schedule is loaded from a URL and is not saved. Are you
          sure you want to load schedule {confirmName} without saving your
          current schedule?
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setConfirmSave("")}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              firehose.loadSave(confirmSave);
              setConfirmSave("");
            }}
          >
            Load schedule
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function RenameBar(props: { firehose: Firehose; saveId: string }) {
  const { firehose, saveId } = props;
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  return !show ? (
    <Button className="btn btn-secondary btn-sm" onClick={() => setShow(true)}>
      Rename
    </Button>
  ) : (
    <form
      className="non-class-form"
      onSubmit={(e) => {
        e.preventDefault();
        firehose.renameSave(saveId, name);
        setName("");
        setShow(false);
      }}
    >
      <label>New name: </label>{" "}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button className="btn btn-secondary btn-sm" type="submit">
        Rename
      </Button>
    </form>
  );
}

function DeleteModal(props: {
  firehose: Firehose;
  saveId: string;
  name: string;
}) {
  const { firehose, saveId, name } = props;
  const [show, setShow] = useState(false);

  return (
    <>
      <Button
        className="btn btn-secondary btn-sm"
        onClick={() => setShow(true)}
      >
        Delete
      </Button>
      <Modal isOpen={show} onClose={() => setShow(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Are you sure?</ModalHeader>
          <ModalBody>Are you sure you want to delete {name}?</ModalBody>
          <ModalFooter>
            <Button onClick={() => setShow(false)} mr={2}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                firehose.removeSave(saveId);
                setShow(false);
              }}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

function ExportModal(props: { firehose: Firehose }) {
  const { firehose } = props;
  const [show, setShow] = useState(false);
  const link = firehose.urlify();
  const { hasCopied, onCopy } = useClipboard(link);

  return (
    <>
      <Button
        className="btn btn-secondary btn-sm"
        onClick={() => setShow(true)}
      >
        Share
      </Button>
      <Modal isOpen={show} onClose={() => setShow(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share schedule</ModalHeader>
          <ModalBody>
            Share the following link:
            <br />
            <a href={link}>{link}</a>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShow(false)} mr={2}>
              Close
            </Button>
            <Button onClick={() => onCopy()}>
              {hasCopied ? "Copied!" : "Copy"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export function ScheduleSwitcher(props: {
  firehose: Firehose;
  saveId: string;
  saves: Array<Save>;
}) {
  const { firehose, saveId, saves } = props;

  const currentName = saves.find((save) => save.id === saveId)?.name!;
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(currentName);

  // TODO: factor out renaming logic from here and non-class activities
  return (
    <Flex align="center" justify="center" gap={2}>
      {isRenaming ? (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New Schedule"
          size="sm"
          width="fit-content"
        />
      ) : (
        <SelectWithWarn firehose={firehose} saveId={saveId} saves={saves} />
      )}
      <ButtonGroup variant="outline" size="sm">
        {isRenaming ? (
          <>
            <Button
              onClick={() => {
                firehose.renameSave(saveId, name);
                setIsRenaming(false);
              }}
            >
              Confirm
            </Button>
            <Button
              onClick={() => {
                setName(currentName);
                setIsRenaming(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            {saveId && (
              <Button onClick={() => setIsRenaming(true)}>Rename</Button>
            )}
            {saveId && (
              <DeleteModal
                firehose={firehose}
                saveId={saveId}
                name={saves.find((save) => save.id === saveId)!.name}
              />
            )}
            <Button
              className="btn btn-secondary btn-sm"
              onClick={() => firehose.addSave(Boolean(saveId))}
            >
              {saveId ? "New" : "Save"}
            </Button>
            <ExportModal firehose={firehose} />
          </>
        )}
      </ButtonGroup>
    </Flex>
  );
}
