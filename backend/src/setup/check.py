import os
import json
import tkinter as tk
from tkinter import ttk, messagebox
from pymongo import MongoClient
from dotenv import load_dotenv
import pyperclip

# Load environment variables
load_dotenv('.env')
load_dotenv('.env.local')

# MongoDB connection
client = MongoClient(os.getenv("DATABASE"))
db = client["test"]


def get_collections():
    collections = db.list_collection_names()
    return [(name, db[name].count_documents({})) for name in collections]


def load_documents(collection_name):
    return list(db[collection_name].find({}).limit(20))


# GUI Setup
root = tk.Tk()
root.title("MongoDB Viewer")
root.geometry("1000x600")

# --- Frames ---
left_frame = tk.Frame(root)
left_frame.pack(side=tk.LEFT, fill=tk.Y, padx=5, pady=5)

right_frame = tk.Frame(root)
right_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5, pady=5)

# --- Collections Listbox ---
tk.Label(left_frame, text="Collections").pack()

collections_listbox = tk.Listbox(left_frame, width=30, exportselection=False)
collections_listbox.pack(fill=tk.BOTH, expand=True)

collection_scrollbar = tk.Scrollbar(left_frame, command=collections_listbox.yview)
collections_listbox.config(yscrollcommand=collection_scrollbar.set)
collection_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

# --- Treeview for documents ---
tk.Label(right_frame, text="Documents (click to copy)").pack(anchor='w')

tree_frame = tk.Frame(right_frame)
tree_frame.pack(fill=tk.BOTH, expand=True)

columns = ("Key", "Value")
tree = ttk.Treeview(tree_frame, columns=columns, show="tree headings", selectmode="browse")
tree.heading("#0", text="Document #")
tree.heading("Key", text="Key")
tree.heading("Value", text="Value")

tree_scroll = tk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=tree.yview)
tree.configure(yscrollcommand=tree_scroll.set)

tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
tree_scroll.pack(side=tk.RIGHT, fill=tk.Y)


# --- Copy Buttons ---
button_frame = tk.Frame(right_frame)
button_frame.pack(fill=tk.X, pady=5)

def copy_selected():
    selected = tree.selection()
    if not selected:
        messagebox.showinfo("Copy", "No item selected.")
        return
    values = tree.item(selected[0], "values")
    text = "\n".join(values) if values else tree.item(selected[0], "text")
    pyperclip.copy(text)
    messagebox.showinfo("Copy", "Copied to clipboard!")

def copy_entire_collection():
    if not current_docs:
        return
    pyperclip.copy(json.dumps(current_docs, indent=2, default=str))
    messagebox.showinfo("Copy", "Full collection copied to clipboard!")

copy_btn = tk.Button(button_frame, text="Copy Selected", command=copy_selected)
copy_btn.pack(side=tk.LEFT, padx=5)

copy_all_btn = tk.Button(button_frame, text="Copy Full Collection", command=copy_entire_collection)
copy_all_btn.pack(side=tk.LEFT, padx=5)


# --- Load Collections ---
for name, count in get_collections():
    collections_listbox.insert(tk.END, f"{name} ({count})")

current_docs = []

def on_collection_select(event):
    global current_docs
    selection = collections_listbox.curselection()
    if not selection:
        return

    selected = collections_listbox.get(selection[0])
    collection_name = selected.split(" (")[0]
    tree.delete(*tree.get_children())

    try:
        current_docs = load_documents(collection_name)
        for i, doc in enumerate(current_docs, 1):
            doc_id = tree.insert("", "end", text=f"Document #{i}")
            for k, v in doc.items():
                tree.insert(doc_id, "end", values=(k, str(v)))
    except Exception as e:
        messagebox.showerror("Error", str(e))


collections_listbox.bind("<<ListboxSelect>>", on_collection_select)

# Enable mouse scroll
def on_mouse_wheel(event):
    if collections_listbox.winfo_containing(event.x_root, event.y_root):
        collections_listbox.yview_scroll(-1 * (event.delta // 120), "units")
    else:
        tree.yview_scroll(-1 * (event.delta // 120), "units")

root.bind_all("<MouseWheel>", on_mouse_wheel)

# Start app
collections_listbox.focus()
root.mainloop()
