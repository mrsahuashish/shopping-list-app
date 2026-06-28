interface DeleteConfirmModalProps {
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ itemName, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg p-6 space-y-4 max-w-sm">
        <div>
          <h2 className="text-lg font-bold text-foreground">Delete Item?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Are you sure you want to delete &quot;{itemName}&quot;? This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-border rounded-lg text-foreground hover:bg-secondary transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-destructive text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
