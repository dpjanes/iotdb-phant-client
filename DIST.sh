#
#   DIST.sh
#
#   David Janes
#   IOTDB
#   2014-09-56
#
#   Distribute iotdb-phant-client to NPM
#

DO_NPM_IOTDB_PACKAGE=true
DIST_ROOT=/var/tmp/iotdb-phant-client.dist.$$
IOTDB_ROOT=$HOME/iotdb

if [ ! -d "$DIST_ROOT" ]
then
    mkdir "$DIST_ROOT"
fi

if $DO_NPM_IOTDB_PACKAGE
then
    echo "=================="
    echo "NPM Packge: iotdb"
    echo "=================="
    (
        NPM_IOTDB_SRC=../iotdb-phant-client
        cd $NPM_IOTDB_SRC || exit 1

        NPM_IOTDB_DST=$DIST_ROOT/iotdb-phant-client
        echo "NPM_IOTDB_DST=$NPM_IOTDB_DST"

        if [ -d ${NPM_IOTDB_DST} ]
        then
            rm -rf "${NPM_IOTDB_DST}"
        fi
        mkdir "${NPM_IOTDB_DST}" || exit 1

        python -c "
import json

filename = 'package.json'
jd = json.load(open(filename))
versions = jd['version'].split('.')
versions[-1] = '%d' % ( int(versions[-1]) + 1, )
jd['version'] = '.'.join(versions)
json.dump(jd, open(filename, 'w'), sort_keys=True, indent=4)
print 'new package version:', jd['version']
" || exit 1

        tar cf - \
            README.md \
            LICENSE \
            phant.js \
            package.json \
            |
        ( cd "${NPM_IOTDB_DST}" && tar xvf - )

        ## cp dist/*.* "${NPM_IOTDB_DST}" || exit 1

        cd "${NPM_IOTDB_DST}" || exit 1
        npm publish

        echo "end"
    )
fi
