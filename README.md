
# Rough Ideas for module

I need a few features for DagDB that aren't easy with the existing
CAR format and the existing libraries.

1. I want one object instance that be read and write and is
lazy in all of its operations.
2. I want the manifest to be parsed without loading any block
data into memory so that I can check what is in the file and
read individual blocks one at a time.
3. I want to be able to write new blocks to the file and have them
stored in-memory or in /tmp until I'm ready to serialize a new CAR file.
4. When I serialize a new CAR file I want to reuse continuous sectors
from the old file without re-encoding and just directly copy them over
instead.
5. I want to write the manifest for the CAR file as a footer so that on
subsequent loads of the file I can get the manifest without parsing
the entire file.

# CAR format 1.5

I think i found a way to hack a footer manifest into the existing CAR format v1.

You write as the last block in the CAR file a `raw` block with SHA2-256 CID. The
binary is fixed to 9 bytes and contains a varint. That varint is the length of the
footer block which is right before the last block that was encoded.

This way, you can write a manifest at the end of the file and always be able to
succesfully read backwards to the footer. You also put a note in the CAR header's
CBOR block next to the `version` and `roots` with `footer: 1.5`. The CAR file
in indeterministic according to existing CAR format v1 standards, but it is valid,
some of the data at the end is just not actually in the graph referenced by the
roots.
