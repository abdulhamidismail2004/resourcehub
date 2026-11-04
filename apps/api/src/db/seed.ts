import { getDb } from './index.js';
import { runMigrations } from './migrate.js';
import * as schema from './schema/index.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function seedDatabase() {
  await runMigrations();
  const db = await getDb();
  console.log('Seeding database with academic demonstration data...');

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);

  const usersData = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      email: 'admin@resourcehub.edu',
      passwordHash: adminPasswordHash,
      displayName: 'System Administrator',
      role: 'admin',
      institution: 'ResourceHub Academic Consortium',
      bio: 'Platform administrator overseeing academic moderation and system integrity.',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      email: 'moderator@resourcehub.edu',
      passwordHash: passwordHash,
      displayName: 'Academic Moderator',
      role: 'moderator',
      institution: 'University of Cambridge',
      bio: 'Senior academic reviewer for STEM curricula and computer science.',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      email: 'ahmed.mansour@cairo.edu',
      passwordHash: passwordHash,
      displayName: 'Prof. Ahmed Mansour',
      role: 'user',
      institution: 'Cairo University',
      bio: 'Professor of Computational Linguistics and Discrete Mathematics.',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      email: 'elena.rostova@mit.edu',
      passwordHash: passwordHash,
      displayName: 'Dr. Elena Rostova',
      role: 'user',
      institution: 'MIT',
      bio: 'Researcher in Distributed Systems, Distributed Consensus & Cloud Storage.',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      email: 'student@resourcehub.edu',
      passwordHash: passwordHash,
      displayName: 'Sarah Jenkins',
      role: 'user',
      institution: 'Stanford University',
      bio: 'Undergraduate student majoring in Computer Science and Data Ethics.',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  ];

  for (const user of usersData) {
    await db
      .insert(schema.users)
      .values(user)
      .onConflictDoUpdate({
        target: schema.users.email,
        set: { ...user, updatedAt: new Date() },
      });
  }

  // 2. Seed Categories
  const categoriesData = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Computer Science',
      slug: 'computer-science',
      description: 'Algorithms, data structures, software engineering, AI, and systems programming.',
      icon: 'Cpu',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Mathematics & Statistics',
      slug: 'mathematics',
      description: 'Calculus, linear algebra, probability, discrete math, and applied mathematical models.',
      icon: 'Calculator',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      name: 'Physics & Astronomy',
      slug: 'physics',
      description: 'Classical mechanics, electromagnetism, thermodynamics, quantum theory, and astrophysics.',
      icon: 'Atom',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      name: 'Medicine & Health Sciences',
      slug: 'medicine',
      description: 'Human anatomy, pharmacology, biochemistry, clinical practice, and epidemiology.',
      icon: 'HeartPulse',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000005',
      name: 'Engineering & Robotics',
      slug: 'engineering',
      description: 'Mechanical, electrical, aerospace, civil engineering, and mechatronic design.',
      icon: 'Wrench',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000006',
      name: 'Business & Economics',
      slug: 'business',
      description: 'Microeconomics, corporate finance, market dynamics, econometric analysis, and management.',
      icon: 'TrendingUp',
    },
  ];

  for (const cat of categoriesData) {
    await db
      .insert(schema.categories)
      .values(cat)
      .onConflictDoUpdate({
        target: schema.categories.slug,
        set: cat,
      });
  }

  // 3. Seed Tags
  const tagsData = [
    { id: 'b0000000-0000-0000-0000-000000000001', name: 'Algorithms', slug: 'algorithms' },
    { id: 'b0000000-0000-0000-0000-000000000002', name: 'Data Structures', slug: 'data-structures' },
    { id: 'b0000000-0000-0000-0000-000000000003', name: 'Machine Learning', slug: 'machine-learning' },
    { id: 'b0000000-0000-0000-0000-000000000004', name: 'Calculus', slug: 'calculus' },
    { id: 'b0000000-0000-0000-0000-000000000005', name: 'Linear Algebra', slug: 'linear-algebra' },
    { id: 'b0000000-0000-0000-0000-000000000006', name: 'Quantum Physics', slug: 'quantum-physics' },
    { id: 'b0000000-0000-0000-0000-000000000007', name: 'Python', slug: 'python' },
    { id: 'b0000000-0000-0000-0000-000000000008', name: 'Anatomy', slug: 'anatomy' },
  ];

  for (const tag of tagsData) {
    await db
      .insert(schema.tags)
      .values(tag)
      .onConflictDoUpdate({
        target: schema.tags.slug,
        set: tag,
      });
  }

  // 4. Create sample educational files on disk
  function createSamplePdf(name: string, title: string): { storageKey: string; size: number; checksum: string } {
    const storageKey = `sample-${Date.now()}-${name}`;
    const filePath = path.join(uploadsDir, storageKey);
    // Minimal valid PDF structure with real text
    const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 75 >> stream
BT
/F1 24 Tf
100 700 Td
(${title}) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000227 00000 n 
0000000353 00000 n 
trailer << /Root 1 0 R /Size 6 >>
startxref
424
%%EOF`;
    fs.writeFileSync(filePath, content, 'utf-8');
    const size = Buffer.byteLength(content);
    const checksum = crypto.createHash('sha256').update(content).digest('hex');
    return { storageKey, size, checksum };
  }

  const sampleResources = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      userId: '44444444-4444-4444-4444-444444444444',
      categoryId: 'a0000000-0000-0000-0000-000000000001',
      title: 'Advanced Algorithms & Graph Theory Lecture Notes',
      description: 'Comprehensive graduate-level lecture notes covering flow networks, minimum spanning trees, amortized analysis, dynamic programming on trees, and NP-completeness proofs.',
      subject: 'Computer Science',
      academicLevel: 'undergraduate',
      institution: 'MIT',
      visibility: 'public',
      status: 'approved',
      downloadCount: 428,
      bookmarkCount: 89,
      viewCount: 1530,
      thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600',
      fileName: 'Advanced-Algorithms-Notes.pdf',
      mimeType: 'application/pdf',
      fileExt: 'pdf',
      tags: ['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'],
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      userId: '33333333-3333-3333-3333-333333333333',
      categoryId: 'a0000000-0000-0000-0000-000000000002',
      title: 'Multivariable Calculus & Vector Analysis Problem Sets',
      description: 'Rigorous multivariable calculus exercise collection featuring Stokes theorem, Green theorem, divergence theorem, Lagrange multipliers, and surface integrals with step-by-step solutions.',
      subject: 'Mathematics',
      academicLevel: 'undergraduate',
      institution: 'Cairo University',
      visibility: 'public',
      status: 'approved',
      downloadCount: 312,
      bookmarkCount: 64,
      viewCount: 1120,
      thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600',
      fileName: 'Multivariable-Calculus-ProblemSets.pdf',
      mimeType: 'application/pdf',
      fileExt: 'pdf',
      tags: ['b0000000-0000-0000-0000-000000000004'],
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      userId: '44444444-4444-4444-4444-444444444444',
      categoryId: 'a0000000-0000-0000-0000-000000000001',
      title: 'Deep Learning Architectures & Transformer Fundamentals',
      description: 'Technical slide deck and study guide detailing Attention mechanisms, Multi-Head self-attention, Positional encodings, BERT, GPT models, and PyTorch optimization strategies.',
      subject: 'Artificial Intelligence',
      academicLevel: 'postgraduate',
      institution: 'MIT',
      visibility: 'public',
      status: 'approved',
      downloadCount: 654,
      bookmarkCount: 145,
      viewCount: 2400,
      thumbnailUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600',
      fileName: 'Deep-Learning-Transformers.pdf',
      mimeType: 'application/pdf',
      fileExt: 'pdf',
      tags: ['b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000007'],
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      userId: '22222222-2222-2222-2222-222222222222',
      categoryId: 'a0000000-0000-0000-0000-000000000003',
      title: 'Quantum Mechanics: Wavefunctions & Perturbation Theory',
      description: 'Introductory and intermediate quantum physics notes exploring the Schrödinger equation, infinite square well, harmonic oscillator, and time-independent perturbation theory.',
      subject: 'Physics',
      academicLevel: 'undergraduate',
      institution: 'University of Cambridge',
      visibility: 'public',
      status: 'approved',
      downloadCount: 189,
      bookmarkCount: 42,
      viewCount: 780,
      thumbnailUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600',
      fileName: 'Quantum-Mechanics-Lectures.pdf',
      mimeType: 'application/pdf',
      fileExt: 'pdf',
      tags: ['b0000000-0000-0000-0000-000000000006'],
    },
    {
      id: 'c0000000-0000-0000-0000-000000000005',
      userId: '55555555-5555-5555-5555-555555555555',
      categoryId: 'a0000000-0000-0000-0000-000000000004',
      title: 'Human Neuroanatomy & Cranial Nerve Atlas',
      description: 'High-yield illustrated anatomy study notes on cranial nerve pathways, cerebral cortex functional localization, and brainstem cross-sections with mnemonic diagrams.',
      subject: 'Medicine',
      academicLevel: 'professional',
      institution: 'Stanford University',
      visibility: 'public',
      status: 'approved',
      downloadCount: 275,
      bookmarkCount: 76,
      viewCount: 940,
      thumbnailUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600',
      fileName: 'Neuroanatomy-StudyAtlas.pdf',
      mimeType: 'application/pdf',
      fileExt: 'pdf',
      tags: ['b0000000-0000-0000-0000-000000000008'],
    },
    {
      id: 'c0000000-0000-0000-0000-000000000006',
      userId: '55555555-5555-5555-5555-555555555555',
      categoryId: 'a0000000-0000-0000-0000-000000000001',
      title: 'Draft: Modern React 19 State Management & Concurrent Features',
      description: 'Pending community submission detailing Server Actions, useOptimistic, useTransition, and TanStack Query patterns.',
      subject: 'Web Development',
      academicLevel: 'undergraduate',
      institution: 'Stanford University',
      visibility: 'public',
      status: 'pending', // Pending moderation review
      downloadCount: 0,
      bookmarkCount: 2,
      viewCount: 14,
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600',
      fileName: 'React19-State-Patterns.pdf',
      mimeType: 'application/pdf',
      fileExt: 'pdf',
      tags: ['b0000000-0000-0000-0000-000000000007'],
    },
  ];

  for (const res of sampleResources) {
    const { storageKey, size, checksum } = createSamplePdf(res.fileName, res.title);

    await db
      .insert(schema.resources)
      .values({
        id: res.id,
        userId: res.userId,
        categoryId: res.categoryId,
        title: res.title,
        description: res.description,
        subject: res.subject,
        academicLevel: res.academicLevel,
        institution: res.institution,
        visibility: res.visibility,
        status: res.status,
        downloadCount: res.downloadCount,
        bookmarkCount: res.bookmarkCount,
        viewCount: res.viewCount,
        thumbnailUrl: res.thumbnailUrl,
      })
      .onConflictDoUpdate({
        target: schema.resources.id,
        set: {
          title: res.title,
          description: res.description,
          status: res.status,
          updatedAt: new Date(),
        },
      });

    // Insert file metadata
    await db
      .insert(schema.resourceFiles)
      .values({
        resourceId: res.id,
        originalName: res.fileName,
        storageKey: storageKey,
        mimeType: res.mimeType,
        fileSize: size,
        fileExtension: res.fileExt,
        checksumSha256: checksum,
      })
      .onConflictDoNothing();

    // Link tags
    for (const tagId of res.tags) {
      await db
        .insert(schema.resourceTags)
        .values({
          resourceId: res.id,
          tagId: tagId,
        })
        .onConflictDoNothing();
    }
  }

  // 5. Seed Bookmarks & Collections
  const collectionId = 'd0000000-0000-0000-0000-000000000001';
  await db
    .insert(schema.collections)
    .values({
      id: collectionId,
      userId: '55555555-5555-5555-5555-555555555555',
      name: 'Essential Computer Science Papers',
      description: 'Hand-picked foundation materials for graduate exam prep and systems study.',
      isPublic: true,
    })
    .onConflictDoNothing();

  await db
    .insert(schema.collectionItems)
    .values([
      {
        collectionId: collectionId,
        resourceId: 'c0000000-0000-0000-0000-000000000001',
      },
      {
        collectionId: collectionId,
        resourceId: 'c0000000-0000-0000-0000-000000000003',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.bookmarks)
    .values([
      {
        userId: '55555555-5555-5555-5555-555555555555',
        resourceId: 'c0000000-0000-0000-0000-000000000001',
      },
      {
        userId: '55555555-5555-5555-5555-555555555555',
        resourceId: 'c0000000-0000-0000-0000-000000000002',
      },
    ])
    .onConflictDoNothing();

  // 6. Seed Sample Report
  await db
    .insert(schema.reports)
    .values({
      id: 'e0000000-0000-0000-0000-000000000001',
      reporterId: '55555555-5555-5555-5555-555555555555',
      resourceId: 'c0000000-0000-0000-0000-000000000004',
      reason: 'low_quality',
      details: 'Page 12 formula scan has slight blur on the second derivation.',
      status: 'pending',
    })
    .onConflictDoNothing();

  // 7. Seed Sample Notifications
  await db
    .insert(schema.notifications)
    .values([
      {
        userId: '55555555-5555-5555-5555-555555555555',
        type: 'upload_approved',
        title: 'Resource Approved',
        message: 'Your resource "Human Neuroanatomy & Cranial Nerve Atlas" was approved by moderators.',
        linkUrl: '/resources/c0000000-0000-0000-0000-000000000005',
        isRead: false,
      },
      {
        userId: '44444444-4444-4444-4444-444444444444',
        type: 'system',
        title: 'Welcome to ResourceHub',
        message: 'Welcome to ResourceHub! Discover and share peer-reviewed academic notes.',
        linkUrl: '/discover',
        isRead: true,
      },
    ])
    .onConflictDoNothing();

  console.log('Database seeded successfully!');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
