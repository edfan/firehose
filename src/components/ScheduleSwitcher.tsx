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

import { Firehose, Save } from "../lib/firehose";

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
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Are you sure?</ModalHeader>
          <ModalBody>
            The current schedule is loaded from a URL and is not saved. Are you
            sure you want to load schedule {confirmName} without saving your
            current schedule?
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setConfirmSave("")} mr={2}>
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
        </ModalContent>
      </Modal>
    </>
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
      <Button onClick={() => setShow(true)} variant="outline" size="sm">
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
      <Button onClick={() => setShow(true)} variant="outline" size="sm">
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
      {isRenaming ? (
        <ButtonGroup variant="outline" size="sm">
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
        </ButtonGroup>
      ) : (
        <>
          {saveId && (
            <Button
              onClick={() => setIsRenaming(true)}
              variant="outline"
              size="sm"
            >
              Rename
            </Button>
          )}
          {saveId && (
            <DeleteModal
              firehose={firehose}
              saveId={saveId}
              name={saves.find((save) => save.id === saveId)!.name}
            />
          )}
          <Button
            onClick={() => firehose.addSave(Boolean(saveId))}
            variant="outline"
            size="sm"
          >
            {saveId ? "New" : "Save"}
          </Button>
          <ExportModal firehose={firehose} />
        </>
      )}
    </Flex>
  );
}
