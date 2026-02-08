"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
// Use bundled elkjs build for browser/node compatibility
import ELK from "elkjs/lib/elk.bundled";
import type { ElkNode } from "elkjs/lib/elk.bundled";
import { SkillTreeNode, SkillNodeData } from "@/app/components/skill-tree-node";
import { X, Search } from "lucide-react";

interface Skill {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  spineOrder: number;
}

interface UserSkillProgress {
  skillId: string;
  level: "unlocked" | "bronze" | "silver" | "gold" | "platinum";
  timesUsedValidated: number;
  distinctContexts: number;
}

interface SkillTreeProps {
  skills: Skill[];
  userSkills: Map<string, UserSkillProgress>;
  prerequisites: Record<string, string[]>;
  onNodeClick?: (skillId: string) => void;
}

const nodeTypes = {
  skill: SkillTreeNode,
} as const;

export function SkillTreeCanvas({
  skills,
  userSkills,
  prerequisites,
  onNodeClick,
}: SkillTreeProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(skills.map((s) => s.category))).sort();

  // Layout nodes using ELK
  const layoutNodes = useCallback(async () => {
    if (skills.length === 0) return;

    const elk = new ELK();

    // Create ELK graph structure
    const elkEdges = Object.entries(prerequisites).flatMap(([target, sources]) => {
      const targetSkill = skills.find((s) => s.slug === target);
      if (!targetSkill) return [];
      return sources.map((source) => ({
        id: `e-${source}-${target}`,
        sources: [source],
        targets: [target],
      }));
    });

    const elkNodes: ElkNode[] = skills.map((skill) => ({
      id: skill.slug,
      width: 200,
      height: 140,
    }));

    const elkGraph: ElkNode = {
      id: "root",
      layoutOptions: {
        "elk.algorithm": "layered",
        "elk.direction": "DOWN",
        "elk.layered.spacing.nodeNodeBetweenLayers": "100",
        "elk.spacing.nodeNode": "80",
        "elk.edge.type": "orthogonal",
      },
      children: elkNodes,
      edges: elkEdges as any,
    };

    try {
      const layouted = await elk.layout(elkGraph);

      // Convert ELK positions to React Flow nodes
      const flowNodes: Node<SkillNodeData>[] = (layouted.children || []).map((elkNode: ElkNode) => {
        const skill = skills.find((s) => s.slug === elkNode.id);
        if (!skill) return null;

        const userSkill = userSkills.get(skill.id);
        const progress = userSkill ? (userSkill.timesUsedValidated || 0) / 50 : 0; // Max 50 reps
        const state = userSkill?.level || "unlocked";

        return {
          id: skill.slug,
          data: {
            label: skill.title,
            category: skill.category,
            state: state as any,
            progress: Math.min(1, progress),
            description: skill.description,
          } as SkillNodeData,
          position: {
            x: elkNode.x || 0,
            y: elkNode.y || 0,
          },
          type: "skill",
        };
      }).filter(Boolean) as Node<SkillNodeData>[];

      setNodes(flowNodes);

      // Create edges for prerequisites
      const flowEdges: Edge[] = Object.entries(prerequisites).flatMap(([target, sources]) => {
        return sources.map((source) => ({
          id: `e-${source}-${target}`,
          source,
          target,
          animated: false,
          style: {
            stroke: "#64748b",
            strokeWidth: 2,
          },
          markerEnd: { type: "arrowclosed", color: "#64748b" },
        } as Edge));
      });

      setEdges(flowEdges);

      // Fit view after layout
      setTimeout(() => fitView(), 0);
    } catch (error) {
      console.error("ELK layout error:", error);
    }
  }, [skills, userSkills, prerequisites, setNodes, setEdges, fitView]);

  // Run layout on mount and when data changes
  useEffect(() => {
    layoutNodes();
  }, [layoutNodes]);

  // Filter nodes based on search and category
  const filteredNodeIds = new Set<string>();
  if (searchTerm || selectedCategory) {
    skills.forEach((skill) => {
      const matchesSearch = searchTerm === "" || 
        skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || skill.category === selectedCategory;

      if (matchesSearch && matchesCategory) {
        filteredNodeIds.add(skill.slug);
      }
    });
  }

  // Update node visibility based on filters
  const displayNodes = nodes.map((node) => ({
    ...node,
    style: {
      ...node.style,
      opacity: filteredNodeIds.size === 0 || filteredNodeIds.has(node.id) ? 1 : 0.3,
    },
  }));

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    onNodeClick?.(nodeId);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value) {
      // Find matching node and focus
      const matchingSkill = skills.find(
        (s) =>
          s.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
          s.slug.includes(e.target.value.toLowerCase())
      );
      if (matchingSkill) {
        setSelectedNodeId(matchingSkill.slug);
      }
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-950">
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={(event, node) => handleNodeClick(node.id)}
        fitView
      >
        <Background color="#334155" gap={16} />
        <Controls />

        {/* Top panel with search and filters */}
        <Panel position="top-left" className="bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search skills..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category filters */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-300 uppercase">Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedCategory === null
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2">
              <p className="font-semibold mb-1">Skills: {skills.length}</p>
              <p>Click a node to see details</p>
            </div>
          </div>
        </Panel>

        {/* Bottom right: Legend */}
        <Panel position="bottom-right" className="bg-gray-900 border border-gray-700 rounded-lg p-3">
          <div className="text-xs space-y-1">
            <p className="font-semibold text-gray-200 mb-2">States</p>
            {[
              { state: "locked", color: "bg-gray-600" },
              { state: "unlocked", color: "bg-blue-600" },
              { state: "bronze", color: "bg-amber-600" },
              { state: "silver", color: "bg-slate-500" },
              { state: "gold", color: "bg-yellow-500" },
              { state: "platinum", color: "bg-purple-500" },
            ].map((item) => (
              <div key={item.state} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded ${item.color}`} />
                <span className="text-gray-300 capitalize">{item.state}</span>
              </div>
            ))}
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
