// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2025 NumFOCUS

/**
 * File tree builder for lazy-loading file browser
 * Builds tree structure client-side from flat file array and renders on demand
 */

// Types
export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  url?: string;
  size?: string;
  id?: string;
  hasChildren?: boolean;
}

export interface CodeFile {
  title: string;
  url: string;
  id?: string;
  extra?: {
    size_bytes?: number;
  };
}

export interface TreeStructure {
  root: TreeNode[];
  map: Map<string, TreeNode[]>;
}

// Format bytes helper
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round(bytes / Math.pow(k, i) * 10) / 10} ${sizes[i]}`;
}

// Get file icon based on extension
export function getFileIcon(filename: string): string {
  const ext = filename.toLowerCase();

  // Medical imaging formats
  const medicalExts = ['.nii', '.nii.gz', '.dcm', '.nrrd', '.mha', '.mhd', '.vtk', '.vti', '.stl', '.ply', '.mz3', '.off', '.obj'];
  if (medicalExts.some(e => ext.endsWith(e))) return 'file-zipper';

  // Images
  const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff', '.tif'];
  if (imageExts.some(e => ext.endsWith(e))) return 'file-image';

  // Code files
  const codeIconMap: Record<string, string> = {
    '.py': 'file-code', '.cpp': 'file-code', '.cxx': 'file-code', '.h': 'file-code',
    '.hxx': 'file-code', '.txx': 'file-code', '.hpp': 'file-code', '.c': 'file-code',
    '.js': 'file-code', '.ts': 'file-code', '.java': 'file-code', '.cs': 'file-code',
    '.cmake': 'file-code', '.json': 'file-code', '.xml': 'file-code', '.yaml': 'file-code',
    '.yml': 'file-code', '.md': 'file-lines', '.txt': 'file-lines',
  };

  for (const [extension, icon] of Object.entries(codeIconMap)) {
    if (ext.endsWith(extension)) return icon;
  }

  return 'file';
}

// Build tree structure from flat codeFiles array
export function buildTreeStructure(files: CodeFile[]): TreeStructure {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();
  const childrenMap = new Map<string, TreeNode[]>();

  // Initialize root children
  childrenMap.set('', []);

  files.forEach((file) => {
    const relativePath = file.title.replace('root/code/', '');
    const parts = relativePath.split('/');
    const fileName = parts[parts.length - 1];

    // Build folder structure
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

      if (!folderMap.has(currentPath)) {
        const folderNode: TreeNode = {
          name: folderName,
          path: currentPath,
          type: 'folder',
          hasChildren: true
        };
        folderMap.set(currentPath, folderNode);
        childrenMap.set(currentPath, []);

        // Add to parent's children
        const parentChildren = childrenMap.get(parentPath) || [];
        parentChildren.push(folderNode);
        childrenMap.set(parentPath, parentChildren);
      }
    }

    // Add file to its parent folder
    const fileNode: TreeNode = {
      name: fileName,
      path: relativePath,
      type: 'file',
      url: file.url,
      size: file.extra?.size_bytes ? formatBytes(file.extra.size_bytes) : undefined,
      id: file.id
    };

    const parentPath = parts.length === 1 ? '' : parts.slice(0, -1).join('/');
    const parentChildren = childrenMap.get(parentPath) || [];
    parentChildren.push(fileNode);
    childrenMap.set(parentPath, parentChildren);
  });

  return { root: childrenMap.get('') || [], map: childrenMap };
}

// Create a single tree item element (without children for folders)
export function createTreeItem(node: TreeNode, isLazy: boolean = true): HTMLElement {
  const item = document.createElement('wa-tree-item');
  item.setAttribute('data-path', node.path);
  item.setAttribute('data-type', node.type);

  if (node.type === 'folder') {
    // Mark as lazy-loadable if it has children
    if (isLazy && node.hasChildren) {
      item.setAttribute('lazy', '');
      item.setAttribute('data-children-loaded', 'false');
    }

    const icon = document.createElement('wa-icon');
    icon.setAttribute('name', 'folder');
    icon.setAttribute('variant', 'regular');
    item.appendChild(icon);
    item.appendChild(document.createTextNode(node.name));
  } else {
    item.setAttribute('data-url', node.url || '');
    item.setAttribute('data-cid', node.id || '');

    const icon = document.createElement('wa-icon');
    icon.setAttribute('name', getFileIcon(node.name));
    icon.setAttribute('variant', 'regular');
    item.appendChild(icon);
    item.appendChild(document.createTextNode(node.name));

    if (node.size) {
      const actions = document.createElement('span');
      actions.setAttribute('slot', 'end');
      actions.className = 'file-actions';

      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'file-size';
      sizeSpan.textContent = node.size;
      actions.appendChild(sizeSpan);

      const copyIcon = document.createElement('wa-icon');
      copyIcon.setAttribute('name', 'copy');
      copyIcon.setAttribute('variant', 'regular');
      copyIcon.className = 'action-icon copy-cid-icon';
      copyIcon.setAttribute('data-cid', node.id || '');
      copyIcon.setAttribute('title', 'Copy CID');
      actions.appendChild(copyIcon);

      const downloadIcon = document.createElement('wa-icon');
      downloadIcon.setAttribute('name', 'download');
      downloadIcon.className = 'action-icon download-icon';
      downloadIcon.setAttribute('data-url', node.url || '');
      downloadIcon.setAttribute('title', 'Download file');
      actions.appendChild(downloadIcon);

      item.appendChild(actions);
    }
  }

  return item;
}

/**
 * FileTreeManager handles lazy-loading file tree initialization and expansion
 */
export class FileTreeManager {
  private treeDataMap: Map<string, TreeNode[]> = new Map();
  private initialized = false;

  /**
   * Initialize the file tree from raw code files data
   * Only renders top-level items; children are loaded on folder expand
   */
  initialize(codeFiles: CodeFile[]): boolean {
    if (this.initialized) return false;

    const fileTreeEl = document.getElementById('file-tree');
    const loadingEl = document.getElementById('file-tree-loading');

    if (!fileTreeEl || !codeFiles || codeFiles.length === 0) {
      if (loadingEl) loadingEl.style.display = 'none';
      return false;
    }

    console.log(`Building tree from ${codeFiles.length} files...`);
    const startTime = performance.now();

    // Build tree structure client-side
    const { root, map } = buildTreeStructure(codeFiles);
    this.treeDataMap = map;

    // Only render top-level items
    for (const node of root) {
      fileTreeEl.appendChild(createTreeItem(node));
    }

    // Set up lazy loading on folder expand
    fileTreeEl.addEventListener('wa-lazy-load', (event: Event) => {
      const item = event.target as HTMLElement;
      if (item.getAttribute('data-type') === 'folder') {
        this.loadFolderChildren(item);
      }
    });

    // Also listen for wa-expand as fallback
    fileTreeEl.addEventListener('wa-expand', (event: Event) => {
      const item = event.target as HTMLElement;
      if (item.getAttribute('data-type') === 'folder' && item.getAttribute('data-children-loaded') !== 'true') {
        this.loadFolderChildren(item);
      }
    });

    if (loadingEl) {
      loadingEl.style.display = 'none';
    }

    const elapsed = performance.now() - startTime;
    console.log(`File tree built in ${elapsed.toFixed(0)}ms (${root.length} top-level items)`);
    this.initialized = true;
    return true;
  }

  /**
   * Load children for a folder when expanded
   */
  loadFolderChildren(folderItem: HTMLElement): void {
    const folderPath = folderItem.getAttribute('data-path');
    if (!folderPath || folderItem.getAttribute('data-children-loaded') === 'true') return;

    const children = this.treeDataMap.get(folderPath);
    if (!children) return;

    // Create and append child items
    for (const child of children) {
      folderItem.appendChild(createTreeItem(child));
    }

    folderItem.setAttribute('data-children-loaded', 'true');
    folderItem.removeAttribute('lazy');
  }

  /**
   * Check if tree has been initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
